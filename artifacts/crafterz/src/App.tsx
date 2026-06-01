import { ProvidersAndInitialization } from "@/features/app/providers-and-initialization";
import { MiniApp } from "@/features/app/mini-app";

export default function App() {
  return (
    <ProvidersAndInitialization>
      <MiniApp />
    </ProvidersAndInitialization>
  );
}
