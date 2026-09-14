import { redirect } from "next/navigation";
import { getChapterReaderData } from "@/lib/books/queries";
import { ReaderClientContainer } from "@/components/reader/ReaderClientContainer";

interface ReadEntryPageProps {
  params: Promise<{
    bookSlug: string;
  }>;
}

export default async function ReadEntryPage({ params }: ReadEntryPageProps) {
  const { bookSlug } = await params;
  let data = null;

  try {
    data = await getChapterReaderData(bookSlug);
  } catch (err) {
    console.warn("Could not fetch book entry on server (offline):", err);
  }

  if (data && data.currentChapter) {
    redirect(`/read/${bookSlug}/${data.currentChapter.slug}`);
  }

  // If offline and could not resolve on server, let ReaderClientContainer find it in IndexedDB
  return <ReaderClientContainer bookSlug={bookSlug} initialData={null} />;
}
