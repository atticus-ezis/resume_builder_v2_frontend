export function docTypeToText(doc_type: string): string {
  switch (doc_type) {
    case "resume":
      return "Resume";
    case "cover_letter":
      return "Cover Letter";
    default:
      return doc_type;
  }
}
