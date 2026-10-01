export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Welcome to HemaPulse</h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl text-center">
        The Smart Blood & Emergency Donor Network.
      </p>
      
      <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-100 max-w-md w-full text-center">
        <h3 className="text-xl font-bold text-red-600 mb-2">Tailwind CSS is Working!</h3>
        <p className="text-gray-500">
          This is a temporary landing page to verify the frontend foundation.
        </p>
      </div>
    </div>
  )
}

