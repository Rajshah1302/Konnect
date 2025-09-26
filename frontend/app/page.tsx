import { Hero } from "@/components/Hero";
export default function Home() {
  return (
    <div className="bg-black">
      <div className="overflow-hidden">
        <Hero />
      </div>
      <div id="events" className="min-h-screen bg-black -mt-20 blur-lg">
      </div>
    </div>
  );
}
