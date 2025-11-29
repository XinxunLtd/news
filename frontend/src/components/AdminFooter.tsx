'use client'

export default function AdminFooter() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-6 py-6">
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Copyright Xinxun, Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

