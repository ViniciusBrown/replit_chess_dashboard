import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          <div className="px-5 py-2">
            <Link href="/about">
              <a className="text-sm text-neutral-600 hover:text-neutral-800">
                About
              </a>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/privacy">
              <a className="text-sm text-neutral-600 hover:text-neutral-800">
                Privacy
              </a>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/terms">
              <a className="text-sm text-neutral-600 hover:text-neutral-800">
                Terms
              </a>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/contact">
              <a className="text-sm text-neutral-600 hover:text-neutral-800">
                Contact
              </a>
            </Link>
          </div>
        </nav>
        <p className="mt-4 text-center text-sm text-neutral-500">
          &copy; {currentYear} ChessTutor. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
