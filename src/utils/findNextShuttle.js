export function findNextShuttles(schedule, currentTime = new Date(), count = 3) {
  const results = []
  const today = new Date(currentTime)
  let hour = today.getHours()
  let minute = today.getMinutes()
  let totalHoursChecked = 0

  while (results.length < count && totalHoursChecked < 24) {
    const h = (hour + totalHoursChecked) % 24
    const dayOffset = hour + totalHoursChecked >= 24 ? 1 : 0
    const hourKey = h.toString().padStart(2, '0')
    const minutes = schedule[hourKey] || []

    const relevantMinutes = totalHoursChecked === 0
      ? minutes.filter(m => m > minute)
      : minutes

    for (const m of relevantMinutes) {
      const shuttleTime = new Date(currentTime)
      shuttleTime.setDate(shuttleTime.getDate() + dayOffset)
      shuttleTime.setHours(h, m, 0, 0)
      results.push(shuttleTime)
      if (results.length === count) break
    }

    totalHoursChecked++
  }

  return results
}