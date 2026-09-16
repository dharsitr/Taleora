#!/usr/bin/env python3
"""
Taleora Cloud Chapter Uploader
Bundles and compresses local chapter JSON files and uploads them to the
'book-chapters' Supabase Storage bucket.
"""

import os
import sys
import json
import gzip
import time
import argparse
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

CONTENT_DIR = "content/books"
PROGRESS_FILE = ".temp/chapters_upload_progress.json"
ERRORS_FILE = ".temp/chapters_upload_errors.log"


def load_env():
    env_vars = {}
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip("\"'")
    return env_vars


class ChapterUploader:
    def __init__(self, supabase_url: str, service_role_key: str, concurrency: int = 8):
        self.supabase_url = supabase_url.rstrip("/")
        self.key = service_role_key
        self.concurrency = concurrency
        self.lock = Lock()
        self.progress = self._load_progress()
        self.errors = []

    def _load_progress(self) -> set:
        os.makedirs(".temp", exist_ok=True)
        if os.path.exists(PROGRESS_FILE):
            try:
                with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
                    return set(json.load(f))
            except Exception:
                return set()
        return set()

    def _save_progress(self, slug: str):
        with self.lock:
            self.progress.add(slug)
            with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
                json.dump(list(self.progress), f)

    def _log_error(self, slug: str, error: str):
        with self.lock:
            self.errors.append((slug, error))
            with open(ERRORS_FILE, "a", encoding="utf-8") as f:
                f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {slug}: {error}\n")

    def upload_book(self, book_slug: str) -> dict:
        book_dir = os.path.join(CONTENT_DIR, book_slug)
        if not os.path.isdir(book_dir):
            return {"status": "skipped", "slug": book_slug, "reason": "not a directory"}

        if book_slug in self.progress:
            return {"status": "skipped", "slug": book_slug, "reason": "already uploaded"}

        # Collect all chapters
        chapters = {}
        chapter_files = sorted(os.listdir(book_dir))
        for fname in chapter_files:
            if not fname.endswith(".json"):
                continue
            fpath = os.path.join(book_dir, fname)
            try:
                with open(fpath, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    ch_slug = data.get("chapterSlug") or fname[:-5]
                    content = data.get("content", "")
                    chapters[ch_slug] = content
            except Exception as e:
                # If an individual chapter file fails to read, skip it
                pass

        if not chapters:
            return {"status": "skipped", "slug": book_slug, "reason": "no chapters found"}

        # Bundle & Gzip
        raw_json = json.dumps(chapters, ensure_ascii=False).encode("utf-8")
        gz_data = gzip.compress(raw_json)

        # Upload to Supabase Storage: bucket 'book-chapters'
        url = f"{self.supabase_url}/storage/v1/object/book-chapters/{book_slug}.json"
        req = urllib.request.Request(
            url,
            data=gz_data,
            headers={
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
                "x-upsert": "true",
            },
            method="POST",
        )

        max_retries = 3
        for attempt in range(max_retries):
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    if resp.status in (200, 201):
                        self._save_progress(book_slug)
                        return {
                            "status": "success",
                            "slug": book_slug,
                            "chapters": len(chapters),
                            "raw_kb": len(raw_json) / 1024,
                            "gz_kb": len(gz_data) / 1024,
                        }
            except urllib.error.HTTPError as e:
                if attempt == max_retries - 1:
                    err_msg = f"HTTP {e.code}: {e.read().decode('utf-8', errors='ignore')}"
                    self._log_error(book_slug, err_msg)
                    return {"status": "error", "slug": book_slug, "error": err_msg}
                time.sleep(1 + attempt)
            except Exception as e:
                if attempt == max_retries - 1:
                    err_msg = str(e)
                    self._log_error(book_slug, err_msg)
                    return {"status": "error", "slug": book_slug, "error": err_msg}
                time.sleep(1 + attempt)

        return {"status": "error", "slug": book_slug, "error": "Unknown failure"}


def main():
    parser = argparse.ArgumentParser(description="Upload chapter bundles to Supabase Storage")
    parser.add_argument("--concurrency", type=int, default=8, help="Number of concurrent upload workers (default: 8)")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of books to process")
    args = parser.parse_args()

    env = load_env()
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = env.get("SUPABASE_SECRET_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        print("❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY missing in .env.local")
        sys.exit(1)

    if not os.path.exists(CONTENT_DIR):
        print(f"❌ Error: {CONTENT_DIR} does not exist.")
        sys.exit(1)

    all_books = sorted(os.listdir(CONTENT_DIR))
    all_books = [b for b in all_books if os.path.isdir(os.path.join(CONTENT_DIR, b))]

    if args.limit:
        all_books = all_books[:args.limit]

    print(f"📚 Found {len(all_books)} books in {CONTENT_DIR} to process.")
    uploader = ChapterUploader(supabase_url, service_role_key, concurrency=args.concurrency)
    print(f"   Already uploaded: {len(uploader.progress)} books.")

    remaining = [b for b in all_books if b not in uploader.progress]
    print(f"   Remaining to upload: {len(remaining)} books with {args.concurrency} concurrent workers.\n")

    start_time = time.time()
    successful = 0
    skipped = 0
    errors = 0

    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = {executor.submit(uploader.upload_book, b): b for b in remaining}
        total = len(remaining)
        done = 0

        for f in as_completed(futures):
            res = f.result()
            done += 1
            if res["status"] == "success":
                successful += 1
            elif res["status"] == "skipped":
                skipped += 1
            else:
                errors += 1
                print(f"⚠️  [{done}/{total}] Error uploading {res['slug']}: {res.get('error')}")

            if done % 50 == 0 or done == total:
                elapsed = time.time() - start_time
                speed = done / max(1, elapsed)
                rem_sec = (total - done) / max(0.01, speed)
                pct = (done / total) * 100
                print(f"--- Progress: {done}/{total} ({pct:.1f}%) | Success: {successful} | Errors: {errors} | Speed: {speed:.1f} b/s | Est. Remaining: {rem_sec/60:.1f}m ---")

    total_time = time.time() - start_time
    print("\n=======================================================")
    print(f"  Upload Complete in {total_time:.1f} seconds ({total_time/60:.1f} minutes)")
    print(f"  Processed: {len(remaining)}")
    print(f"  Successful: {successful}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors: {errors}")
    print("=======================================================\n")


if __name__ == "__main__":
    main()
