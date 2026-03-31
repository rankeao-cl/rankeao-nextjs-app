import { Suspense } from "react";
import VerifyEmailForm from "./VerifyEmailForm";

export const metadata = {
  title: "Verificar Email",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
