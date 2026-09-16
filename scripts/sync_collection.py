#!/usr/bin/env python3
"""
Taleora Collection Sync & DB Population Engine
1. Deletes books from DB that were removed from the Books/ folder.
2. Ingests any missing books.
3. Populates full chapter content directly into public.chapters.content in Postgres.
"""

import os
import sys
import re
import json
import time
import zipfile
import hashlib
import argparse
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

CONTENT_DIR = "content/books"
BOOKS_DIR = "Books"
PROGRESS_FILE = ".temp/sync_collection_progress.json"

COVER_GRADIENTS = [
    ("from-amber-700 via-orange-900 to-stone-900", "#ea580c"),
    ("from-emerald-800 via-teal-950 to-slate-900", "#10b981"),
    ("from-indigo-800 via-purple-950 to-slate-900", "#6366f1"),
    ("from-rose-800 via-red-950 to-stone-900", "#f43f5e"),
    ("from-cyan-800 via-sky-950 to-slate-900", "#06b6d4"),
    ("from-violet-800 via-fuchsia-950 to-slate-900", "#8b5cf6"),
]


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


def clean_html_to_prose(html_str: str) -> str:
    html_str = re.sub(r"<!--.*?-->", "", html_str, flags=re.DOTALL)
    html_str = re.sub(r"<head.*?>.*?</head>", "", html_str, flags=re.DOTALL | re.I)
    html_str = re.sub(r"<style.*?>.*?</style>", "", html_str, flags=re.DOTALL | re.I)
    html_str = re.sub(r"<script.*?>.*?</script>", "", html_str, flags=re.DOTALL | re.I)
    html_str = re.sub(r"<(p|div|br|h[1-6]|li|tr)[^>]*>", "\n\n", html_str, flags=re.I)
    text = re.sub(r"<[^>]+>", "", html_str)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    cleaned = re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
    return cleaned


def load_env():
    env = {}
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.strip().split("=", 1)
                    env[k.strip()] = v.strip("\"'")
    return env


class CollectionSyncer:
    def __init__(self, supabase_url: str, key: str, concurrency: int = 8):
        self.url = supabase_url.rstrip("/")
        self.key = key
        self.concurrency = concurrency
        self.lock = Lock()
        self.genres_cache = {}
        self.authors_cache = {}
        self.progress = self._load_progress()
        self._preload_caches()

    def _preload_caches(self):
        try:
            genres = self._request("GET", "/rest/v1/genres?select=id,name,slug") or []
            for g in genres:
                self.genres_cache[slugify(g["name"])] = g["id"]
                self.genres_cache[g["slug"]] = g["id"]

            authors = self._request("GET", "/rest/v1/authors?select=id,name,slug") or []
            for a in authors:
                self.authors_cache[slugify(a["name"])] = a["id"]
                self.authors_cache[a["slug"]] = a["id"]
            print(f"   Preloaded {len(self.genres_cache)//2} genres and {len(self.authors_cache)//2} authors.")
        except Exception as e:
            print("Warning preloading caches:", e)

    def _load_progress(self) -> set:
        os.makedirs(".temp", exist_ok=True)
        if os.path.exists(PROGRESS_FILE):
            try:
                with open(PROGRESS_FILE, "r") as f:
                    return set(json.load(f))
            except Exception:
                return set()
        return set()

    def _save_progress(self, file_path: str):
        with self.lock:
            self.progress.add(file_path)
            with open(PROGRESS_FILE, "w") as f:
                json.dump(list(self.progress), f)

    def _request(self, method: str, path: str, data=None, headers=None, max_retries=3):
        url = f"{self.url}{path}" if path.startswith("/") else path
        hdrs = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        if headers:
            hdrs.update(headers)

        payload = json.dumps(data, ensure_ascii=False).encode("utf-8") if data is not None else None

        for attempt in range(max_retries):
            try:
                req = urllib.request.Request(url, data=payload, headers=hdrs, method=method)
                with urllib.request.urlopen(req, timeout=30) as resp:
                    raw = resp.read().decode("utf-8", errors="ignore")
                    return json.loads(raw) if raw and raw.strip() else None
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", errors="ignore")
                if attempt == max_retries - 1:
                    raise RuntimeError(f"HTTP {e.code} on {method} {path}: {body}")
                time.sleep(1 + attempt)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                time.sleep(1 + attempt)
        return None

    def cleanup_deleted_books(self, disk_files: set):
        print("🔍 Checking database for deleted books...")
        all_db_books = []
        offset = 0
        limit = 1000
        while True:
            batch = self._request("GET", f"/rest/v1/books?select=id,file_path,user_id,title&offset={offset}&limit={limit}") or []
            all_db_books.extend(batch)
            if len(batch) < limit:
                break
            offset += limit

        to_delete = []
        for b in all_db_books:
            if b.get("user_id"):
                continue  # Never delete user-created books
            fp = b.get("file_path")
            if not fp or (fp not in disk_files and fp.replace("./", "") not in disk_files):
                to_delete.append(b)

        print(f"   Found {len(all_db_books)} books in DB.")
        print(f"   Identified {len(to_delete)} books that were deleted from disk.")

        if to_delete:
            print(f"🗑️ Deleting {len(to_delete)} orphaned books from DB...")
            # Batch delete
            BATCH = 100
            for i in range(0, len(to_delete), BATCH):
                batch_ids = [b["id"] for b in to_delete[i:i+BATCH]]
                ids_str = ",".join(f'"{bid}"' for bid in batch_ids)
                self._request("DELETE", f"/rest/v1/books?id=in.({ids_str})")
            print(f"   Deleted {len(to_delete)} books successfully.")

    def get_or_create_genre(self, name: str) -> str:
        slug = slugify(name)
        with self.lock:
            if slug in self.genres_cache:
                return self.genres_cache[slug]

        # Query first
        q = self._request("GET", f"/rest/v1/genres?slug=eq.{slug}&select=id")
        if not q:
            q = self._request("GET", f"/rest/v1/genres?name=eq.{urllib.parse.quote(name.strip())}&select=id")
        with self.lock:
            if q and len(q) > 0:
                self.genres_cache[slug] = q[0]["id"]
                return q[0]["id"]

        try:
            res = self._request(
                "POST",
                "/rest/v1/genres",
                data={"name": name.strip(), "slug": slug, "description": f"Curated works in {name}."},
                headers={"Prefer": "return=representation,resolution=ignore-duplicates"},
            )
            with self.lock:
                if res and isinstance(res, list) and len(res) > 0:
                    gid = res[0]["id"]
                    self.genres_cache[slug] = gid
                    return gid
        except Exception:
            pass

        q = self._request("GET", f"/rest/v1/genres?slug=eq.{slug}&select=id")
        with self.lock:
            if q and len(q) > 0:
                self.genres_cache[slug] = q[0]["id"]
                return q[0]["id"]
        raise RuntimeError(f"Could not resolve genre ID for {name}")

    def get_or_create_author(self, name: str) -> str:
        slug = slugify(name)
        with self.lock:
            if slug in self.authors_cache:
                return self.authors_cache[slug]

        # Query first
        q = self._request("GET", f"/rest/v1/authors?slug=eq.{slug}&select=id")
        if not q:
            q = self._request("GET", f"/rest/v1/authors?name=eq.{urllib.parse.quote(name.strip())}&select=id")
        with self.lock:
            if q and len(q) > 0:
                self.authors_cache[slug] = q[0]["id"]
                return q[0]["id"]

        try:
            res = self._request(
                "POST",
                "/rest/v1/authors",
                data={"name": name.strip(), "slug": slug, "bio": f"Author of classic literature: {name}."},
                headers={"Prefer": "return=representation,resolution=ignore-duplicates"},
            )
            with self.lock:
                if res and isinstance(res, list) and len(res) > 0:
                    aid = res[0]["id"]
                    self.authors_cache[slug] = aid
                    return aid
        except Exception:
            pass

        q = self._request("GET", f"/rest/v1/authors?slug=eq.{slug}&select=id")
        with self.lock:
            if q and len(q) > 0:
                self.authors_cache[slug] = q[0]["id"]
                return q[0]["id"]
        raise RuntimeError(f"Could not resolve author ID for {name}")

    def parse_epub(self, file_path: str):
        with zipfile.ZipFile(file_path, "r") as z:
            container_xml = z.read("META-INF/container.xml").decode("utf-8", errors="ignore")
            m = re.search(r'full-path=[\"\']([^\"\']+)[\"\']', container_xml)
            opf_path = m.group(1) if m else "content.opf"
            opf_dir = os.path.dirname(opf_path)

            opf_xml = z.read(opf_path).decode("utf-8", errors="ignore")
            root = ET.fromstring(opf_xml)

            # Metadata
            title_el = root.find(".//{http://purl.org/dc/elements/1.1/}title")
            author_el = root.find(".//{http://purl.org/dc/elements/1.1/}creator")
            desc_el = root.find(".//{http://purl.org/dc/elements/1.1/}description")

            title = title_el.text.strip() if title_el is not None and title_el.text else "Untitled Work"
            author = author_el.text.strip() if author_el is not None and author_el.text else "Unknown Author"
            description = desc_el.text.strip() if desc_el is not None and desc_el.text else None

            # Manifest
            manifest = {}
            for item in root.findall(".//{http://www.idpf.org/2007/opf}item"):
                manifest[item.get("id")] = {
                    "href": item.get("href"),
                    "media-type": item.get("media-type"),
                }

            # Cover
            cover_bytes = None
            cover_ext = "jpg"
            cover_item = None
            for item in manifest.values():
                if "cover" in item.get("href", "").lower() and item.get("media-type", "").startswith("image/"):
                    cover_item = item
                    break
            if cover_item:
                cover_href = os.path.normpath(os.path.join(opf_dir, cover_item["href"]))
                if cover_href in z.namelist():
                    cover_bytes = z.read(cover_href)
                    cover_ext = "png" if cover_href.lower().endswith(".png") else "jpg"

            # Chapters
            spine = root.find(".//{http://www.idpf.org/2007/opf}spine")
            itemrefs = spine.findall("{http://www.idpf.org/2007/opf}itemref") if spine is not None else []
            chapters = []
            num = 1
            for ref in itemrefs:
                idref = ref.get("idref")
                if idref not in manifest:
                    continue
                href = os.path.normpath(os.path.join(opf_dir, manifest[idref]["href"]))
                if href not in z.namelist():
                    continue
                raw_html = z.read(href).decode("utf-8", errors="ignore")
                prose = clean_html_to_prose(raw_html)
                words = prose.split()
                if len(words) < 10 and len(itemrefs) > 1:
                    continue

                title_m = re.search(r"<title>(.*?)</title>", raw_html, re.I)
                h_m = re.search(r"<h[1-3][^>]*>(.*?)</h[1-3]>", raw_html, re.I)
                ch_title = ""
                if h_m and len(re.sub(r"<[^>]+>", "", h_m.group(1)).strip()) > 2:
                    ch_title = re.sub(r"<[^>]+>", "", h_m.group(1)).strip()
                elif title_m and len(title_m.group(1).strip()) > 2 and title_m.group(1).strip() != title:
                    ch_title = title_m.group(1).strip()
                if not ch_title or ch_title.lower() == "untitled":
                    ch_title = f"Chapter {num}"

                read_mins = max(1, round(len(words) / 200))
                ch_slug = f"chapter-{num}-{slugify(ch_title)[:30]}".rstrip("-")
                chapters.append({
                    "chapter_number": num,
                    "title": ch_title,
                    "slug": ch_slug,
                    "content": prose,
                    "word_count": len(words),
                    "estimated_read_minutes": read_mins,
                })
                num += 1

            return {
                "title": title,
                "author": author,
                "description": description,
                "cover_bytes": cover_bytes,
                "cover_ext": cover_ext,
                "chapters": chapters,
            }

    def sync_book(self, file_path: str) -> dict:
        if file_path in self.progress:
            return {"status": "skipped", "file": file_path}

        genre_name = os.path.basename(os.path.dirname(file_path))
        genre_id = self.get_or_create_genre(genre_name)

        # 1. Check if book already exists in DB by file_path
        q = self._request("GET", f"/rest/v1/books?file_path=eq.{urllib.parse.quote(file_path)}&select=id,slug,title,total_chapters")
        
        parsed = None
        chapters = []

        if q and len(q) > 0:
            book = q[0]
            book_id = book["id"]
            book_slug = book["slug"]

            # Load chapters from content/books if available
            local_dir = os.path.join(CONTENT_DIR, book_slug)
            if os.path.isdir(local_dir):
                for fname in sorted(os.listdir(local_dir)):
                    if fname.endswith(".json"):
                        try:
                            with open(os.path.join(local_dir, fname), "r", encoding="utf-8") as fp:
                                d = json.load(fp)
                                chapters.append({
                                    "chapter_number": d["chapterNumber"],
                                    "title": d["title"],
                                    "slug": d["chapterSlug"],
                                    "content": d["content"],
                                    "word_count": len(d["content"].split()),
                                    "estimated_read_minutes": max(1, round(len(d["content"].split()) / 200)),
                                })
                        except Exception:
                            pass

            # If not in content/books, parse EPUB
            if not chapters:
                parsed = self.parse_epub(file_path)
                chapters = parsed["chapters"]
        else:
            # New book
            parsed = self.parse_epub(file_path)
            title = parsed["title"]
            author = parsed["author"]
            description = parsed["description"]
            chapters = parsed["chapters"]
            author_id = self.get_or_create_author(author)
            book_slug = f"{slugify(title)}-{slugify(author)}"[:70].rstrip("-")

            grad_idx = abs(hash(title)) % len(COVER_GRADIENTS)
            cover_grad, cover_acc = COVER_GRADIENTS[grad_idx]

            # Upload cover
            cover_url = None
            if parsed["cover_bytes"]:
                mime = "image/png" if parsed["cover_ext"] == "png" else "image/jpeg"
                c_path = f"{slugify(author)}/{book_slug}-cover.{parsed['cover_ext']}"
                try:
                    self._request(
                        "POST",
                        f"/storage/v1/object/book-covers/{c_path}",
                        data=parsed["cover_bytes"],
                        headers={"Content-Type": mime, "x-upsert": "true"}
                    )
                    cover_url = f"{self.url}/storage/v1/object/public/book-covers/{c_path}"
                except Exception:
                    pass

            total_words = sum(c["word_count"] for c in chapters)
            total_read_time = sum(c["estimated_read_minutes"] for c in chapters)

            res = self._request(
                "POST",
                "/rest/v1/books",
                data={
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
                },
                headers={"Prefer": "return=representation"}
            )
            if not res:
                raise RuntimeError(f"Failed to create book for {file_path}")
            book_id = res[0]["id"]
            self._request("POST", "/rest/v1/book_genres", data={"book_id": book_id, "genre_id": genre_id}, headers={"Prefer": "resolution=ignore-duplicates"})

        # 2. Upsert Chapters directly into public.chapters WITH FULL CONTENT!
        if chapters:
            chapters_payload = []
            for ch in chapters:
                chapters_payload.append({
                    "book_id": book_id,
                    "chapter_number": ch["chapter_number"],
                    "title": ch["title"],
                    "slug": ch["slug"],
                    "content": ch["content"],  # Full text in Postgres!
                    "word_count": ch["word_count"],
                    "estimated_read_minutes": ch["estimated_read_minutes"],
                    "status": "published",
                })

            BATCH = 50
            for i in range(0, len(chapters_payload), BATCH):
                batch = chapters_payload[i : i + BATCH]
                self._request(
                    "POST",
                    "/rest/v1/chapters?on_conflict=book_id,chapter_number",
                    data=batch,
                    headers={"Prefer": "resolution=merge-duplicates"}
                )

        self._save_progress(file_path)
        return {"status": "success", "file": file_path, "chapters": len(chapters)}


def main():
    parser = argparse.ArgumentParser(description="Taleora Collection Sync & DB Ingestion")
    parser.add_argument("--concurrency", type=int, default=8, help="Concurrency workers (default: 8)")
    parser.add_argument("--limit", type=int, default=None, help="Limit books to process")
    args = parser.parse_args()

    env = load_env()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("SUPABASE_SECRET_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        print("❌ Error: Supabase credentials missing in .env.local (require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY)")
        sys.exit(1)

    # Collect disk files
    disk_files = []
    for root, dirs, files in os.walk(BOOKS_DIR):
        for f in sorted(files):
            if f.endswith(".epub"):
                disk_files.append(os.path.join(root, f))

    print(f"📖 Found {len(disk_files)} books in {BOOKS_DIR}/")

    syncer = CollectionSyncer(url, key, concurrency=args.concurrency)
    syncer.cleanup_deleted_books(set(disk_files))

    target_files = disk_files if not args.limit else disk_files[:args.limit]
    remaining = [f for f in target_files if f not in syncer.progress]

    print(f"\n🚀 Populating database with chapter text for {len(remaining)} books...")
    start_time = time.time()
    successful = 0
    errors = 0

    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = {executor.submit(syncer.sync_book, f): f for f in remaining}
        total = len(remaining)
        done = 0

        for f in as_completed(futures):
            done += 1
            try:
                res = f.result()
                if res["status"] == "success":
                    successful += 1
                else:
                    successful += 1
            except Exception as e:
                errors += 1
                print(f"⚠️ [{done}/{total}] Error processing {futures[f]}: {e}")

            if done % 25 == 0 or done == total:
                elapsed = time.time() - start_time
                speed = done / max(1, elapsed)
                rem_sec = (total - done) / max(0.01, speed)
                pct = (done / total) * 100
                print(f"--- Progress: {done}/{total} ({pct:.1f}%) | Success: {successful} | Errors: {errors} | Speed: {speed:.1f} b/s | Est. Remaining: {rem_sec/60:.1f}m ---")

    total_time = time.time() - start_time
    print("\n=======================================================")
    print(f"  Sync & DB Population Complete in {total_time:.1f} seconds ({total_time/60:.1f} minutes)")
    print(f"  Successful: {successful}")
    print(f"  Errors: {errors}")
    print("=======================================================\n")


if __name__ == "__main__":
    main()
