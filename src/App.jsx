import { useEffect, useState } from 'react'
import schedule from './data/weekday.json'
import { findNextShuttles } from './utils/findNextShuttle'

// Define your station data
const lines = {
  TCL: {
    name: 'Tung Chung Line',
    stations: [
      { code: 'HOK', name: 'Hong Kong' },
      { code: 'KOW', name: 'Kowloon' },
      { code: 'OLY', name: 'Olympic' },
      { code: 'NAC', name: 'Nam Cheong' },
      { code: 'LAK', name: 'Lai King' },
      { code: 'TSY', name: 'Tsing Yi' },
      { code: 'SUN', name: 'Sunny Bay' },
      { code: 'TUC', name: 'Tung Chung' },
    ]
  },
  TWL: {
    name: 'Tsuen Wan Line',
    stations: [
      { code: 'CEN', name: 'Central' },
      { code: 'ADM', name: 'Admiralty' },
      { code: 'TST', name: 'Tsim Sha Tsui' },
      { code: 'JOR', name: 'Jordan' },
      { code: 'YMT', name: 'Yau Ma Tei' },
      { code: 'MOK', name: 'Mong Kok' },
      { code: 'PRE', name: 'Price Edward' },
      { code: 'SSP', name: 'Sham Shui Po' },
      { code: 'CSW', name: 'Cheung Sha Wan' },
      { code: 'LCK', name: 'Lai Chi Kok' },
      { code: 'MEF', name: 'Mei Foo' },
      { code: 'LAK', name: 'Lai King' },
      { code: 'KWF', name: 'Kwai Fong' },
      { code: 'KWH', name: 'Kwai Hing' },
      { code: 'TWH', name: 'Tai Wo Hau' },
      { code: 'TSW', name: 'Tsuen Wan' },
    ]
  }
}

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
  const [selectedLine, setSelectedLine] = useState('TCL')
  const [selectedStation, setSelectedStation] = useState('TSY')
  const [favouriteStations, setFavouriteStations] = useState([])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const shuttles = findNextShuttles(schedule, now, 5)
    setNextBuses(shuttles)
  }, [now])

  useEffect(() => {
    const line = lines[selectedLine]
    fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${selectedLine}&sta=${selectedStation}&lang=en`)
      .then(res => res.json())
      .then(data => {
        const downList = data?.data?.[`${selectedLine}-${selectedStation}`]?.DOWN || []
        const upList = data?.data?.[`${selectedLine}-${selectedStation}`]?.UP || []

        const validDownTrains = downList.filter(train => train.valid === 'Y')
        const validUpTrains = upList.filter(train => train.valid === 'Y')

        const formattedDown = validDownTrains.map(train => {
          const [dateStr, timeStr] = train.time.split(' ')
          const trainTime = new Date(`${dateStr}T${timeStr}`)
          return {
            display: `${timeStr.substring(0, 5)} (Towards ${train.dest})`,
            countdown: minutesUntil(trainTime, new Date())
          }
        })

        const formattedUp = validUpTrains.map(train => {
          const [dateStr, timeStr] = train.time.split(' ')
          const trainTime = new Date(`${dateStr}T${timeStr}`)
          return {
            display: `${timeStr.substring(0, 5)} (Towards ${train.dest})`,
            countdown: minutesUntil(trainTime, new Date())
          }
        })

        setMtrTimes({ down: formattedDown.slice(0, 4), up: formattedUp.slice(0, 4) })
        setLastUpdated(new Date())
      })
      .catch(err => {
        console.error('❌ Failed to fetch MTR data:', err)
        setMtrTimes({ down: [], up: [] })
      })
  }, [selectedLine, selectedStation])

  const handleLineChange = (event) => {
    setSelectedLine(event.target.value)
    setSelectedStation(lines[event.target.value].stations[0].code)
  }

  const handleStationChange = (event) => {
    setSelectedStation(event.target.value)
  }

  const handleFavourite = (stationCode) => {
    if (!favouriteStations.includes(stationCode)) {
      setFavouriteStations([...favouriteStations, stationCode])
    }
  }

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

      <div className="bg-white shadow-md rounded-2xl p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">🚌 Bus - Ma Wan to Tsing Yi</h2>
        <h3 className="text-sm mb-2">Next 5 Shuttle Buses</h3>
        <hr className="my-2 border-gray-300" />
        {nextBuses.length > 0 ? (
          nextBuses.map((bus, index) => (
            <div key={index} className="mb-2">
              <p>🚌 <strong>Shuttle:</strong> {formatTime(bus)} <span className="text-sm text-gray-500">({formatCountdown(minutesUntil(bus, now))})</span></p>
              {index < nextBuses.length - 1 && <hr className="my-2 border-gray-300" />}
            </div>
          ))
        ) : (
          <p className="text-xs">No more buses today 💤</p>
        )}
      </div>

      <div className="bg-white shadow-md rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-2">🚆 Train Schedule</h2>

        <h3 className="text-sm mb-2">Select MTR Line</h3>
        <select onChange={handleLineChange} value={selectedLine} className="mb-2 p-2 w-full">
          {Object.keys(lines).map((line) => (
            <option key={line} value={line}>{lines[line].name}</option>
          ))}
        </select>

        <h3 className="text-sm mb-2">Select MTR Station</h3>
        <select onChange={handleStationChange} value={selectedStation} className="mb-2 p-2 w-full">
          {lines[selectedLine].stations.map(station => (
            <option key={station.code} value={station.code}>
              {station.name}
            </option>
          ))}
        </select>

        <h3 className="text-sm mb-2">Next Trains (Heading towards {lines[selectedLine].stations.find(station => station.code === selectedStation).name})</h3>
        <hr className="my-2 border-gray-300" />
        {mtrTimes.down.length > 0 ? (
          mtrTimes.down.map((train, i) => (
            <div key={i} className="mb-2">
              <p>🚆 <strong>Train:</strong> {train.display} <span className="text-sm text-gray-500">({formatCountdown(train.countdown)})</span></p>
              {i < mtrTimes.down.length - 1 && <hr className="my-2 border-gray-300" />}
            </div>
          ))
        ) : (
          <p className="text-xs">No trains heading towards {selectedStation} 🛤</p>
        )}

        <h3 className="text-sm mb-2">Next Trains (Coming from {lines[selectedLine].stations.find(station => station.code === selectedStation).name})</h3>
        <hr className="my-2 border-gray-300" />
        {mtrTimes.up.length > 0 ? (
          mtrTimes.up.map((train, i) => (
            <div key={i} className="mb-2">
              <p>🚆 <strong>Train:</strong> {train.display} <span className="text-sm text-gray-500">({formatCountdown(train.countdown)})</span></p>
              {i < mtrTimes.up.length - 1 && <hr className="my-2 border-gray-300" />}
            </div>
          ))
        ) : (
          <p className="text-xs">No trains coming from {selectedStation} 🛤</p>
        )}
      </div>
    </main>
  )
}

export default App
