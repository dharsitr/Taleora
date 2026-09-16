#!/usr/bin/env python3
"""
Taleora Bulk Ebook Ingestion Engine
===================================
Scans Books/ directory, extracts metadata, covers, and chapters,
stores chapter content in local storage (content/books/),
uploads covers to Supabase Storage (book-covers), and imports
lightweight book and chapter records into Supabase Postgres.
"""

import os
import sys
import glob
import json
import time
import re
import html
import random
import hashlib
import zipfile
import gzip
import argparse
import threading
import unicodedata
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed

# Beautiful Taleora aesthetic gradient presets
COVER_GRADIENTS = [
    ("from-amber-700 via-stone-800 to-zinc-950", "#E28743"),
    ("from-stone-800 via-zinc-900 to-black", "#D97706"),
    ("from-orange-800 via-amber-950 to-stone-950", "#F97316"),
    ("from-emerald-800 via-stone-900 to-zinc-950", "#10B981"),
    ("from-teal-800 via-slate-900 to-zinc-950", "#14B8A6"),
    ("from-sky-800 via-slate-900 to-zinc-950", "#0EA5E9"),
    ("from-indigo-800 via-stone-900 to-zinc-950", "#6366F1"),
    ("from-rose-800 via-zinc-900 to-stone-950", "#F43F5E"),
    ("from-violet-800 via-stone-900 to-zinc-950", "#8B5CF6"),
    ("from-zinc-800 via-neutral-900 to-black", "#71717A"),
]

PROGRESS_FILE = os.path.join(".temp", "import_progress.json")
ERROR_LOG_FILE = os.path.join(".temp", "import_errors.log")
CONTENT_DIR = os.path.join("content", "books")


def load_env():
    """Loads environment variables from .env.local without external dependencies."""
    env = dict(os.environ)
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    env[k] = v
    return env


def slugify(text: str) -> str:
    """Converts a string into a clean, URL-safe ASCII slug."""
    orig = text
    text = text.replace("æ", "ae").replace("œ", "oe").replace("ß", "ss")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii").lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text).strip("-")
    if not text:
        h = hashlib.md5(orig.encode("utf-8")).hexdigest()[:8]
        return f"book-{h}"
    return text


def clean_html_to_prose(raw_html: str) -> str:
    """
    Cleans raw HTML into clean text with paragraphs separated by double newlines,
    matching Taleora's splitContentIntoParagraphs reader paginator.
    """
    # Remove script, style, head
    text = re.sub(r"<(script|style|head)[^>]*>.*?</\1>", "", raw_html, flags=re.DOTALL | re.IGNORECASE)
    # Convert <br> to newline
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    # Convert block elements and headers to double newlines
    text = re.sub(r"</(p|h[1-6]|div|blockquote|section|li|tr)>", "\n\n", text, flags=re.IGNORECASE)
    # Strip any remaining tags
    text = re.sub(r"<[^>]+>", "", text)
    # Decode HTML entities
    text = html.unescape(text)
    # Normalize paragraphs
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    return "\n\n".join(paragraphs)


class TaleoraImporter:
    def __init__(self, dry_run=False, upload_ebook=False, base_dir="Books"):
        self.dry_run = dry_run
        self.upload_ebook = upload_ebook
        self.base_dir = base_dir if os.path.exists(base_dir) else "book"
        self.env = load_env()
        self.supabase_url = self.env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
        self.service_role_key = self.env.get("SUPABASE_SECRET_KEY") or self.env.get("SUPABASE_SERVICE_ROLE_KEY", "")
        self.lock = threading.Lock()

        if not self.dry_run and (not self.supabase_url or not self.service_role_key):
            raise ValueError(
                "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY in environment or .env.local"
            )

        os.makedirs(".temp", exist_ok=True)
        os.makedirs(CONTENT_DIR, exist_ok=True)

        self.progress = self._load_progress()
        self.existing_slugs = set()
        self.existing_file_paths = set()
        self.genres_cache = {}  # slug -> id
        self.authors_cache = {}  # slug -> id

        if not self.dry_run:
            self._load_existing_db_records()

    def _load_progress(self):
        if os.path.exists(PROGRESS_FILE):
            try:
                with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_progress(self, file_path, data):
        with self.lock:
            self.progress[file_path] = data
            try:
                with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
                    json.dump(self.progress, f, indent=2)
            except Exception:
                pass

    def _log_error(self, file_path, error_msg):
        with self.lock:
            with open(ERROR_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {file_path}: {error_msg}\n")

    def _request(self, method, endpoint, data=None, headers=None, max_retries=3):
        """HTTP helper with exponential backoff retry for Supabase API calls."""
        if self.dry_run:
            return None

        url = f"{self.supabase_url}{endpoint}"
        default_headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
        }
        if headers:
            default_headers.update(headers)

        payload = None
        if isinstance(data, (dict, list)):
            payload = json.dumps(data).encode("utf-8")
            default_headers["Content-Type"] = "application/json"
        elif isinstance(data, bytes):
            payload = data

        last_error = None
        for attempt in range(max_retries):
            try:
                req = urllib.request.Request(url, data=payload, headers=default_headers, method=method)
                with urllib.request.urlopen(req, timeout=45) as resp:
                    resp_bytes = resp.read()
                    if resp_bytes:
                        try:
                            return json.loads(resp_bytes.decode("utf-8"))
                        except Exception:
                            return resp_bytes
                    return None
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="ignore")
                last_error = f"HTTP {e.code}: {err_body}"
                if e.code in (409, 404, 400):
                    raise RuntimeError(last_error)
                time.sleep(1.5 ** attempt + random.random() * 0.5)
            except Exception as e:
                last_error = str(e)
                time.sleep(1.5 ** attempt + random.random() * 0.5)

        raise RuntimeError(f"Request failed after {max_retries} retries: {last_error}")

    def _load_existing_db_records(self):
        """Loads existing books, authors, and genres to prevent duplicates."""
        print("🔄 Loading existing database records for duplicate detection...")
        try:
            # Existing books
            books = self._request("GET", "/rest/v1/books?select=id,slug,file_path") or []
            for b in books:
                if b.get("slug"):
                    self.existing_slugs.add(b["slug"])
                if b.get("file_path"):
                    self.existing_file_paths.add(b["file_path"])

            # Existing genres
            genres = self._request("GET", "/rest/v1/genres?select=id,name,slug") or []
            for g in genres:
                self.genres_cache[g["slug"]] = g["id"]

            # Existing authors
            authors = self._request("GET", "/rest/v1/authors?select=id,name,slug") or []
            for a in authors:
                self.authors_cache[a["slug"]] = a["id"]

            print(f"   Loaded: {len(self.existing_slugs)} books, {len(self.genres_cache)} genres, {len(self.authors_cache)} authors in cache.")
        except Exception as e:
            print(f"⚠️ Warning: Could not pre-cache DB records: {e}")

    def get_or_create_genre(self, genre_name: str) -> str:
        """Gets or creates genre in public.genres."""
        genre_slug = slugify(genre_name)
        with self.lock:
            if genre_slug in self.genres_cache:
                return self.genres_cache[genre_slug]

        if self.dry_run:
            with self.lock:
                self.genres_cache[genre_slug] = f"dry-genre-{genre_slug}"
                return self.genres_cache[genre_slug]

        # Insert into Supabase
        res = self._request(
            "POST",
            "/rest/v1/genres",
            data={"name": genre_name.strip(), "slug": genre_slug, "description": f"Classic and curated works in {genre_name}."},
            headers={"Prefer": "return=representation,resolution=merge-duplicates"},
        )
        with self.lock:
            if res and isinstance(res, list) and len(res) > 0:
                genre_id = res[0]["id"]
                self.genres_cache[genre_slug] = genre_id
                return genre_id

        # Query fallback
        q = self._request("GET", f"/rest/v1/genres?slug=eq.{genre_slug}&select=id")
        with self.lock:
            if q and len(q) > 0:
                self.genres_cache[genre_slug] = q[0]["id"]
                return q[0]["id"]

        raise RuntimeError(f"Could not resolve genre ID for {genre_name}")

    def get_or_create_author(self, author_name: str) -> str:
        """Gets or creates author in public.authors."""
        author_name = author_name.strip() or "Unknown Author"
        author_slug = slugify(author_name)
        with self.lock:
            if author_slug in self.authors_cache:
                return self.authors_cache[author_slug]

        if self.dry_run:
            with self.lock:
                self.authors_cache[author_slug] = f"dry-author-{author_slug}"
                return self.authors_cache[author_slug]

        res = self._request(
            "POST",
            "/rest/v1/authors",
            data={
                "name": author_name,
                "slug": author_slug,
                "bio": f"Author of classic literature in Taleora.",
            },
            headers={"Prefer": "return=representation,resolution=merge-duplicates"},
        )
        with self.lock:
            if res and isinstance(res, list) and len(res) > 0:
                author_id = res[0]["id"]
                self.authors_cache[author_slug] = author_id
                return author_id

        q = self._request("GET", f"/rest/v1/authors?slug=eq.{author_slug}&select=id")
        with self.lock:
            if q and len(q) > 0:
                self.authors_cache[author_slug] = q[0]["id"]
                return q[0]["id"]

        # If slug conflicted on a different author, append unique hash
        unique_slug = f"{author_slug}-{hashlib.md5(author_name.encode()).hexdigest()[:6]}"
        res2 = self._request(
            "POST",
            "/rest/v1/authors",
            data={"name": author_name, "slug": unique_slug, "bio": f"Author of classic literature in Taleora."},
            headers={"Prefer": "return=representation"},
        )
        with self.lock:
            author_id = res2[0]["id"]
            self.authors_cache[author_slug] = author_id
            return author_id

    def upload_cover_image(self, author_slug: str, book_slug: str, cover_bytes: bytes, ext: str) -> str:
        """Uploads cover image to Supabase Storage bucket 'book-covers'."""
        if self.dry_run or not cover_bytes:
            return None

        mime = "image/png" if ext == "png" else "image/jpeg"
        file_path = f"{author_slug}/{book_slug}-cover.{ext}"
        endpoint = f"/storage/v1/object/book-covers/{file_path}"

        try:
            self._request(
                "POST",
                endpoint,
                data=cover_bytes,
                headers={"Content-Type": mime, "x-upsert": "true"},
            )
            return f"{self.supabase_url}/storage/v1/object/public/book-covers/{file_path}"
        except Exception as e:
            return None

    def upload_ebook_file(self, genre_slug: str, book_slug: str, epub_path: str) -> str:
        """Optional upload of original ebook file to 'ebook-files' bucket."""
        if self.dry_run or not self.upload_ebook:
            return None

        with open(epub_path, "rb") as f:
            data = f.read()

        file_path = f"{genre_slug}/{book_slug}.epub"
        endpoint = f"/storage/v1/object/ebook-files/{file_path}"

        try:
            self._request(
                "POST",
                endpoint,
                data=data,
                headers={"Content-Type": "application/epub+zip", "x-upsert": "true"},
            )
            return f"{self.supabase_url}/storage/v1/object/public/ebook-files/{file_path}"
        except Exception:
            return None

    def upload_chapter_bundle(self, book_slug: str, chapters: list) -> str:
        """Uploads compressed chapter bundle to 'book-chapters' storage bucket."""
        if self.dry_run or not chapters:
            return None

        chapters_dict = {ch["slug"]: ch["content"] for ch in chapters}
        raw_json = json.dumps(chapters_dict, ensure_ascii=False).encode("utf-8")
        gz_data = gzip.compress(raw_json)

        file_path = f"{book_slug}.json"
        endpoint = f"/storage/v1/object/book-chapters/{file_path}"

        try:
            self._request(
                "POST",
                endpoint,
                data=gz_data,
                headers={"Content-Type": "application/json", "x-upsert": "true"},
            )
            return f"{self.supabase_url}/storage/v1/object/public/book-chapters/{file_path}"
        except Exception:
            return None

    def parse_epub(self, file_path: str, initial_genre: str):
        """Parses EPUB archive: extracts metadata, cover, and ordered chapters."""
        with zipfile.ZipFile(file_path, "r") as z:
            # 1. Container -> OPF
            container_xml = z.read("META-INF/container.xml").decode("utf-8", errors="ignore")
            m = re.search(r'full-path=[\"\']([^\"\']+)[\"\']', container_xml)
            if not m:
                raise ValueError("No rootfile in META-INF/container.xml")
            opf_path = m.group(1)
            opf_dir = os.path.dirname(opf_path)
            opf_xml = z.read(opf_path).decode("utf-8", errors="ignore")

            root = ET.fromstring(opf_xml)

            # Metadata extraction
            title_elem = root.find(".//{http://purl.org/dc/elements/1.1/}title")
            creator_elem = root.find(".//{http://purl.org/dc/elements/1.1/}creator")
            desc_elem = root.find(".//{http://purl.org/dc/elements/1.1/}description")

            title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
            author = creator_elem.text.strip() if creator_elem is not None and creator_elem.text else ""
            description = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else ""

            # Filename fallbacks
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            if " — " in base_name:
                parts = base_name.split(" — ", 1)
                if not title:
                    title = parts[0].strip()
                if not author:
                    author = parts[1].strip()
            elif not title:
                title = base_name

            if not author:
                author = "Unknown Author"

            if not description:
                description = f"A classic {initial_genre.lower()} work by {author}."

            # Manifest map: id -> href, media-type, properties
            manifest = {}
            cover_href = None
            for item in root.findall(".//{http://www.idpf.org/2007/opf}item"):
                item_id = item.get("id")
                href = item.get("href")
                media = item.get("media-type", "")
                props = item.get("properties", "")
                if item_id and href:
                    manifest[item_id] = {"href": href, "media": media}
                    if "cover-image" in props or ("cover" in item_id.lower() and media.startswith("image/")):
                        cover_href = href

            # Extract Cover Image Bytes
            cover_bytes = None
            cover_ext = "jpg"
            if cover_href:
                full_cover_path = os.path.normpath(os.path.join(opf_dir, cover_href))
                if full_cover_path in z.namelist():
                    cover_bytes = z.read(full_cover_path)
                    cover_ext = "png" if cover_href.lower().endswith(".png") else "jpg"

            # Spine -> Chapters
            spine = root.find(".//{http://www.idpf.org/2007/opf}spine")
            itemrefs = spine.findall("{http://www.idpf.org/2007/opf}itemref") if spine is not None else []

            chapters = []
            chapter_num = 1

            for ref in itemrefs:
                idref = ref.get("idref")
                if idref not in manifest:
                    continue
                item_href = manifest[idref]["href"]
                full_item_path = os.path.normpath(os.path.join(opf_dir, item_href))
                if full_item_path not in z.namelist():
                    continue

                raw_html = z.read(full_item_path).decode("utf-8", errors="ignore")
                prose = clean_html_to_prose(raw_html)
                words = prose.split()
                word_count = len(words)

                # Skip empty cover pages, title-only banners, or empty nav files
                is_cover_page = "cover" in item_href.lower() and word_count < 25
                is_nav_page = "nav" in item_href.lower() and word_count < 60
                if (is_cover_page or is_nav_page) and len(itemrefs) > 1:
                    continue

                if word_count < 10 and len(itemrefs) > 1:
                    continue

                # Extract title from <title>, <h1>, <h2>, or fallback
                title_m = re.search(r"<title>(.*?)</title>", raw_html, re.I)
                h_m = re.search(r"<h[1-3][^>]*>(.*?)</h[1-3]>", raw_html, re.I)

                ch_title = ""
                if h_m and len(re.sub(r"<[^>]+>", "", h_m.group(1)).strip()) > 2:
                    ch_title = re.sub(r"<[^>]+>", "", h_m.group(1)).strip()
                elif title_m and len(title_m.group(1).strip()) > 2 and title_m.group(1).strip() != title:
                    ch_title = title_m.group(1).strip()

                if not ch_title or ch_title.lower() == "untitled":
                    ch_title = f"Chapter {chapter_num}"

                read_mins = max(1, round(word_count / 200))
                ch_slug = f"chapter-{chapter_num}-{slugify(ch_title)[:30]}".rstrip("-")

                chapters.append({
                    "chapter_number": chapter_num,
                    "title": ch_title,
                    "slug": ch_slug,
                    "content": prose,
                    "word_count": word_count,
                    "estimated_read_minutes": read_mins,
                })
                chapter_num += 1

            # Fallback if no spine items yielded content
            if not chapters:
                for name in sorted(z.namelist()):
                    if name.endswith(".xhtml") or name.endswith(".html"):
                        raw_html = z.read(name).decode("utf-8", errors="ignore")
                        prose = clean_html_to_prose(raw_html)
                        if len(prose.split()) > 20:
                            chapters.append({
                                "chapter_number": len(chapters) + 1,
                                "title": f"Chapter {len(chapters) + 1}",
                                "slug": f"chapter-{len(chapters) + 1}",
                                "content": prose,
                                "word_count": len(prose.split()),
                                "estimated_read_minutes": max(1, round(len(prose.split()) / 200)),
                            })

            return {
                "title": title,
                "author": author,
                "description": description,
                "cover_bytes": cover_bytes,
                "cover_ext": cover_ext,
                "chapters": chapters,
            }

    def parse_pdf(self, file_path: str, initial_genre: str):
        """Parses PDF document: extracts metadata, cover image from page 1, and chapters."""
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise ImportError(
                "PyMuPDF ('fitz') is required to parse PDF books. Please run with .venv: .venv/bin/python scripts/import_books.py"
            )

        doc = fitz.open(file_path)
        meta = doc.metadata or {}

        base_name = os.path.splitext(os.path.basename(file_path))[0]
        title = (meta.get("title") or "").strip()
        author = (meta.get("author") or "").strip()

        # Parse 'Title — Author' or 'Title - Author' from filename if metadata is generic/empty
        if ("—" in base_name or " - " in base_name) and (not title or not author):
            sep = "—" if "—" in base_name else " - "
            parts = base_name.split(sep, 1)
            if not title:
                title = parts[0].strip()
            if not author:
                author = parts[1].strip()

        if not title or len(title) < 2:
            title = base_name.strip()
        if not author or len(author) < 2:
            author = "Unknown Author"

        description = (meta.get("subject") or "").strip()
        if not description:
            description = f"A {initial_genre.lower()} work by {author}."

        # Extract Cover Image from Page 0
        cover_bytes = None
        cover_ext = "jpg"
        if len(doc) > 0:
            try:
                page0 = doc[0]
                pix = page0.get_pixmap(dpi=150)
                cover_bytes = pix.tobytes("jpeg")
                cover_ext = "jpg"
            except Exception:
                cover_bytes = None

        # Extract Chapters
        chapters = []
        toc = doc.get_toc()  # [[lvl, title, page_1_indexed], ...]
        total_pages = len(doc)

        if toc and len(toc) >= 2:
            min_lvl = min(item[0] for item in toc)
            main_toc = [item for item in toc if item[0] <= min_lvl + 1]

            for i, item in enumerate(main_toc):
                ch_title = item[1].strip()
                start_page = max(1, item[2]) - 1
                if i + 1 < len(main_toc):
                    end_page = max(start_page + 1, min(total_pages, main_toc[i + 1][2] - 1))
                else:
                    end_page = total_pages

                if start_page >= total_pages:
                    continue

                ch_text_parts = []
                for p_num in range(start_page, end_page):
                    p_text = doc[p_num].get_text("text").strip()
                    if p_text:
                        ch_text_parts.append(p_text)

                prose = "\n\n".join(ch_text_parts).strip()
                words = prose.split()
                word_count = len(words)

                if word_count < 15 and len(main_toc) > 1:
                    continue

                ch_num = len(chapters) + 1
                ch_slug = f"chapter-{ch_num}-{slugify(ch_title)[:30]}".rstrip("-")
                read_mins = max(1, round(word_count / 200))

                chapters.append({
                    "chapter_number": ch_num,
                    "title": ch_title or f"Chapter {ch_num}",
                    "slug": ch_slug,
                    "content": prose,
                    "word_count": word_count,
                    "estimated_read_minutes": read_mins,
                })

        # Fallback if no TOC or TOC produced 0 chapters: chunk pages into digestible chapters
        if not chapters and total_pages > 0:
            pages_per_chapter = 10 if total_pages > 30 else (5 if total_pages > 10 else total_pages)
            for ch_idx, start_page in enumerate(range(0, total_pages, pages_per_chapter), 1):
                end_page = min(total_pages, start_page + pages_per_chapter)
                ch_text_parts = []
                for p_num in range(start_page, end_page):
                    p_text = doc[p_num].get_text("text").strip()
                    if p_text:
                        ch_text_parts.append(p_text)

                prose = "\n\n".join(ch_text_parts).strip()
                words = prose.split()
                word_count = len(words)

                ch_title = f"Chapter {ch_idx}" if total_pages > pages_per_chapter else "Complete Story"
                ch_slug = f"chapter-{ch_idx}"
                read_mins = max(1, round(word_count / 200))

                chapters.append({
                    "chapter_number": ch_idx,
                    "title": ch_title,
                    "slug": ch_slug,
                    "content": prose,
                    "word_count": word_count,
                    "estimated_read_minutes": read_mins,
                })

        doc.close()

        return {
            "title": title,
            "author": author,
            "description": description,
            "cover_bytes": cover_bytes,
            "cover_ext": cover_ext,
            "chapters": chapters,
        }

    def import_book(self, file_path: str) -> dict:
        """Processes and imports a single ebook (EPUB or PDF) file."""
        # 1. Determine Initial Genre from Folder Name
        parent_dir = os.path.basename(os.path.dirname(file_path))
        genre_name = parent_dir if parent_dir and parent_dir != self.base_dir else "General Fiction"

        # Check duplicate by file path
        with self.lock:
            if file_path in self.existing_file_paths or file_path in self.progress:
                return {"status": "skipped", "file": file_path, "reason": "Already imported"}

        # 2. Parse EPUB or PDF
        if file_path.lower().endswith(".pdf"):
            parsed = self.parse_pdf(file_path, genre_name)
        else:
            parsed = self.parse_epub(file_path, genre_name)
        title = parsed["title"]
        author = parsed["author"]
        description = parsed["description"]
        chapters = parsed["chapters"]
        cover_bytes = parsed["cover_bytes"]
        cover_ext = parsed["cover_ext"]

        if not chapters:
            raise ValueError("No readable chapters found in ebook archive")

        author_slug = slugify(author)
        book_slug = f"{slugify(title)}-{author_slug}"[:70].rstrip("-")

        # Collision avoidance for slugs
        with self.lock:
            if book_slug in self.existing_slugs:
                book_slug = f"{book_slug}-{hashlib.md5(file_path.encode()).hexdigest()[:6]}"
            self.existing_slugs.add(book_slug)
            self.existing_file_paths.add(file_path)

        if self.dry_run:
            total_words = sum(c["word_count"] for c in chapters)
            total_read_mins = sum(c["estimated_read_minutes"] for c in chapters)
            return {
                "status": "dry-run",
                "title": title,
                "author": author,
                "genre": genre_name,
                "slug": book_slug,
                "chapters_count": len(chapters),
                "total_words": total_words,
                "estimated_read_minutes": total_read_mins,
                "has_cover": cover_bytes is not None,
                "file": file_path,
            }

        # 3. Save Chapters Locally to content/books/{bookSlug}/{chapterSlug}.json
        book_content_dir = os.path.join(CONTENT_DIR, book_slug)
        os.makedirs(book_content_dir, exist_ok=True)

        for ch in chapters:
            ch_data = {
                "bookSlug": book_slug,
                "chapterSlug": ch["slug"],
                "chapterNumber": ch["chapter_number"],
                "title": ch["title"],
                "content": ch["content"],
            }
            ch_file = os.path.join(book_content_dir, f"{ch['slug']}.json")
            with open(ch_file, "w", encoding="utf-8") as f:
                json.dump(ch_data, f, ensure_ascii=False)

        # 3b. Upload Chapter Bundle to Supabase Storage 'book-chapters'
        self.upload_chapter_bundle(book_slug, chapters)

        # 4. Resolve Genre and Author IDs in Supabase
        genre_id = self.get_or_create_genre(genre_name)
        author_id = self.get_or_create_author(author)

        # 5. Upload Cover Image to Supabase Storage
        cover_url = None
        if cover_bytes:
            cover_url = self.upload_cover_image(author_slug, book_slug, cover_bytes, cover_ext)

        # 6. Upload EPUB file if enabled
        file_url = None
        if self.upload_ebook:
            file_url = self.upload_ebook_file(slugify(genre_name), book_slug, file_path)

        # Aesthetic gradient picker based on title hash
        grad_idx = abs(hash(title)) % len(COVER_GRADIENTS)
        cover_grad, cover_acc = COVER_GRADIENTS[grad_idx]

        total_words = sum(c["word_count"] for c in chapters)
        total_read_time = sum(c["estimated_read_minutes"] for c in chapters)

        # 7. Insert Book into Supabase public.books
        book_insert_payload = {
            "title": title,
            "slug": book_slug,
            "author_id": author_id,
            "description": description,
            "cover_gradient": cover_grad,
            "cover_accent": cover_acc,
            "cover_image_url": cover_url,
            "status": "published",
            "published_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_chapters": len(chapters),
            "estimated_read_time_minutes": total_read_time,
            "average_rating": 5.0,
            "ratings_count": 0,
            "file_path": file_path,
            "file_url": file_url,
        }

        res_book = self._request(
            "POST",
            "/rest/v1/books",
            data=book_insert_payload,
            headers={"Prefer": "return=representation"},
        )
        if not res_book or len(res_book) == 0:
            raise RuntimeError("Failed to insert book record into Supabase")

        book_id = res_book[0]["id"]

        # 8. Link Book to Genre in public.book_genres
        try:
            self._request(
                "POST",
                "/rest/v1/book_genres",
                data={"book_id": book_id, "genre_id": genre_id},
                headers={"Prefer": "resolution=ignore-duplicates"},
            )
        except Exception:
            pass

        # 9. Insert Chapter Records into public.chapters (content empty to save ~450MB)
        chapters_payload = []
        for ch in chapters:
            chapters_payload.append({
                "book_id": book_id,
                "chapter_number": ch["chapter_number"],
                "title": ch["title"],
                "slug": ch["slug"],
                "content": "",  # Hydrated dynamically from content/books/{bookSlug}/{chapterSlug}.json
                "word_count": ch["word_count"],
                "estimated_read_minutes": ch["estimated_read_minutes"],
                "status": "published",
                "published_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            })

        # Batch insert chapters
        BATCH_SIZE = 100
        for i in range(0, len(chapters_payload), BATCH_SIZE):
            batch = chapters_payload[i : i + BATCH_SIZE]
            self._request("POST", "/rest/v1/chapters", data=batch)

        result = {
            "status": "success",
            "book_id": book_id,
            "title": title,
            "author": author,
            "genre": genre_name,
            "slug": book_slug,
            "chapters": len(chapters),
            "cover_url": cover_url,
            "file": file_path,
        }
        self._save_progress(file_path, result)
        return result


def main():
    parser = argparse.ArgumentParser(description="Taleora Bulk Ebook Ingestion Engine")
    parser.add_argument("--dir", default="Books", help="Directory containing ebooks (default: Books)")
    parser.add_argument("--dry-run", action="store_true", help="Inspect and validate without writing to DB or storage")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of books to process (useful for testing)")
    parser.add_argument("--genre", type=str, default=None, help="Process only a specific genre subfolder")
    parser.add_argument("--upload-ebook", action="store_true", help="Also upload raw EPUB files to ebook-files storage")
    parser.add_argument("--reset-progress", action="store_true", help="Clear import progress tracking")
    parser.add_argument("--concurrency", type=int, default=6, help="Worker threads for processing (default: 6)")

    args = parser.parse_args()

    if args.reset_progress and os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)
        print("🧹 Progress tracking file reset.")

    # Find all ebook files (EPUB & PDF)
    search_dir = args.dir if os.path.exists(args.dir) else ("books" if os.path.exists("books") else "book")
    epubs = glob.glob(os.path.join(search_dir, "**", "*.epub"), recursive=True)
    pdfs = glob.glob(os.path.join(search_dir, "**", "*.pdf"), recursive=True)
    all_files = sorted(epubs + pdfs)

    if args.genre:
        all_files = [f for f in all_files if args.genre.lower() in f.lower()]

    if not all_files:
        print(f"❌ No ebook files found in '{search_dir}' matching criteria.")
        sys.exit(1)

    print(f"\n=======================================================")
    print(f"  Taleora Bulk Ingestion Engine")
    print(f"  Total ebooks discovered: {len(all_files)}")
    print(f"  Mode: {'DRY RUN (No DB/Storage writes)' if args.dry_run else 'PRODUCTION IMPORT'}")
    print(f"  Concurrency: {args.concurrency} worker threads")
    if args.limit:
        print(f"  Limit: {args.limit} books")
    print(f"=======================================================\n")

    files_to_process = all_files[: args.limit] if args.limit else all_files

    importer = TaleoraImporter(
        dry_run=args.dry_run,
        upload_ebook=args.upload_ebook,
        base_dir=search_dir,
    )

    success_count = 0
    skipped_count = 0
    error_count = 0
    completed_total = 0

    start_time = time.time()
    total_files = len(files_to_process)

    def process_one(idx, f):
        try:
            res = importer.import_book(f)
            return (idx, f, res, None)
        except Exception as e:
            importer._log_error(f, str(e))
            return (idx, f, None, str(e))

    if args.dry_run or args.concurrency <= 1:
        # Sequential
        for idx, f in enumerate(files_to_process, 1):
            _, _, res, err = process_one(idx, f)
            completed_total += 1
            if err:
                error_count += 1
                print(f"[{completed_total}/{total_files}] ⚠️  Error: {os.path.basename(f)}: {err}")
            elif res.get("status") == "skipped":
                skipped_count += 1
                if completed_total <= 5 or completed_total % 100 == 0:
                    print(f"[{completed_total}/{total_files}] ⏭️  Skipped: {os.path.basename(f)}")
            elif res.get("status") == "dry-run":
                success_count += 1
                print(f"[{completed_total}/{total_files}] 🔍 [DRY-RUN] \"{res['title']}\" by {res['author']} [{res['genre']}]")
            else:
                success_count += 1
                print(f"[{completed_total}/{total_files}] ✅ Imported: \"{res['title']}\" by {res['author']} ({res['chapters']} chs)")
    else:
        # Multithreaded execution
        with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
            futures = {executor.submit(process_one, i, f): (i, f) for i, f in enumerate(files_to_process, 1)}
            for future in as_completed(futures):
                idx, f, res, err = future.result()
                completed_total += 1

                if err:
                    error_count += 1
                    print(f"[{completed_total}/{total_files}] ⚠️  Error: {os.path.basename(f)}: {err}")
                elif res.get("status") == "skipped":
                    skipped_count += 1
                    if completed_total <= 5 or completed_total % 100 == 0:
                        print(f"[{completed_total}/{total_files}] ⏭️  Skipped: {os.path.basename(f)}")
                else:
                    success_count += 1
                    if completed_total <= 15 or completed_total % 25 == 0 or completed_total == total_files:
                        print(f"[{completed_total}/{total_files}] ✅ Imported: \"{res['title']}\" by {res['author']} ({res['chapters']} chs)")

                # Periodic progress output
                if completed_total % 50 == 0:
                    elapsed = time.time() - start_time
                    rate = completed_total / elapsed if elapsed > 0 else 1
                    rem = (total_files - completed_total) / rate if rate > 0 else 0
                    print(f"--- Progress: {completed_total}/{total_files} ({completed_total/total_files*100:.1f}%) | Success: {success_count} | Skipped: {skipped_count} | Errors: {error_count} | Speed: {rate:.1f} b/s | Est. Remaining: {rem/60:.1f}m ---")

    duration = time.time() - start_time
    print(f"\n=======================================================")
    print(f"  Ingestion Complete in {duration:.1f} seconds ({duration/60:.1f} minutes)")
    print(f"  Processed: {total_files}")
    print(f"  Successful: {success_count}")
    print(f"  Skipped (duplicates): {skipped_count}")
    print(f"  Errors (logged to .temp/import_errors.log): {error_count}")
    print(f"=======================================================\n")


if __name__ == "__main__":
    main()
