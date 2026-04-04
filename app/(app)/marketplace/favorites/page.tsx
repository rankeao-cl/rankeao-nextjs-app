import { redirect } from "next/navigation";

export default function FavoritesPage() {
  redirect("/marketplace?tab=favoritos");
}
