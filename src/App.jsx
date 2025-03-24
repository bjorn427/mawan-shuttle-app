import { useEffect, useState } from 'react'
import schedule from './data/weekday.json'
import { findNextShuttles } from './utils/findNextShuttle'

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function minutesUntil(target, now) {
  return Math.max(0, Math.floor((target - now) / 60000))
}

function formatCountdown(mins) {
  if (mins === 0) return 'Now!'
  const hours = Math.floor(mins / 60)
  const minutes = mins % 60
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`
}

function App() {
  const [nextBuses, setNextBuses] = useState([])
  const [now, setNow] = useState(new Date())
  const [mtrTimes, setMtrTimes] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const shuttles = findNextShuttles(schedule, now, 5)
    setNextBuses(shuttles)
  }, [now])

  useEffect(() => {
    fetch('https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=TCL&sta=TUC&lang=en')
      .then(res => res.json())
      .then(data => {
        const downList = data?.data?.['TCL-TUC']?.DOWN || []
        const validTrains = downList.filter(train => train.dest === 'HOK' && train.valid === 'Y')

        const formatted = validTrains.map(train => {
          const [dateStr, timeStr] = train.time.split(' ')
          const trainTime = new Date(`${dateStr}T${timeStr}`)
          return {
            display: `${timeStr.substring(0, 5)}`,
            countdown: minutesUntil(trainTime, new Date())
          }
        })

        setMtrTimes(formatted.slice(0, 4))
        setLastUpdated(new Date())
      })
      .catch(err => {
        console.error('❌ Failed to fetch MTR data:', err)
        setMtrTimes([])
      })
  }, [])

  const dayOfWeek = now.toLocaleDateString(undefined, { weekday: 'long' })

  return (
    <main className="p-4 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-2">Ma Wan → Tsing Yi</h1>
      <p className="text-sm text-gray-600 mb-1">⏰ {now.toLocaleDateString()} ({dayOfWeek}), {now.toLocaleTimeString()}</p>
      {lastUpdated && (
        <p className="text-xs text-gray-400 mb-4">
          🔄 Last updated at {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}

      {/* Horizontal Line above Shuttle Bus Section */}
      <hr className="my-4 border-gray-300" />

      {/* Bus Section */}
      <div className="bg-white shadow-md rounded-2xl p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">
          🚌 Bus - Ma Wan to Tsing Yi
        </h2>
        <p className="text-xl font-bold text-blue-600 mb-4">Next 5 Shuttle Buses</p>
        <hr className="my-2 border-gray-300" />
        {nextBuses.length > 0 ? (
          nextBuses.map((bus, index) => (
            <div key={index} className="mb-2">
              <p>🚌 <strong>Shuttle:</strong> {formatTime(bus)} <span className="text-sm text-gray-500">({formatCountdown(minutesUntil(bus, now))})</span></p>
              {index < nextBuses.length - 1 && <hr className="my-2 border-gray-300" />}
            </div>
          ))
        ) : (
          <p>No more buses today 💤</p>
        )}
      </div>

      {/* Horizontal Line above Train Section */}
      <hr className="my-4 border-gray-300" />

      {/* Train Section */}
      <div className="bg-white shadow-md rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-2">
          🚆 Train - Tsing Yi to Hong Kong Station
        </h2>
        <p className="text-xl font-bold text-blue-600 mb-4">Next 4 Trains</p>
        <hr className="my-2 border-gray-300" />
        {mtrTimes.length > 0 ? (
          mtrTimes.map((train, i) => (
            <div key={i} className="mb-2">
              <p>🚆 <strong>Train:</strong> {train.display} <span className="text-sm text-gray-500">({formatCountdown(train.countdown)})</span></p>
              {i < mtrTimes.length - 1 && <hr className="my-2 border-gray-300" />}
            </div>
          ))
        ) : (
          <p>No MTR trains available 🛤</p>
        )}
      </div>
    </main>
  )
}

export default App
