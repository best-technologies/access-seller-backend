export default function Footer() {
  return (
    <footer className="bg-indigo-950 text-white py-8 mt-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-bold text-xl">AccessSellr</span>
          <span className="text-sm text-indigo-200">© {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm justify-center">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Help</a>
          <a href="#" className="hover:underline">Become a Marketer</a>
          <a href="#" className="hover:underline">Socials</a>
        </div>
      </div>
    </footer>
  );
}
