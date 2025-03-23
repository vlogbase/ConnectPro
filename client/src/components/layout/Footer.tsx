export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <a href="https://github.com" className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">GitHub</span>
            <i className="ri-github-fill text-xl"></i>
          </a>
          <a href="https://twitter.com" className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Twitter</span>
            <i className="ri-twitter-fill text-xl"></i>
          </a>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-400">&copy; {new Date().getFullYear()} ConnectPro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
