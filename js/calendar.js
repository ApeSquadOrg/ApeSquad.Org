document.addEventListener('DOMContentLoaded', function() {
    // --- EVENT DATA (UPDATED FORMAT) ---
    // You can now use AM/PM format for the time.
    // e.g., "6:00 PM", "9:30 AM"
    const eventsData = [
        { date: '2025-09-11', time: '1:00 PM', name: 'EU QUALS TIDAL SURVIVAL', url: '/tournaments.html' },
        { date: '2025-09-11', time: '8:00 PM', name: 'NA QUALS TIDAL SURVIVAL', url: '/tournaments.html' },
        { date: '2025-09-13', time: '1:00 PM', name: 'APE SQUAD WORLD FINALS', url: '/tournaments.html' },
        // Add more events as needed
    ];

    const calendarDays = document.getElementById('calendar-days');
    const monthYearDisplay = document.getElementById('month-year-display');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    if (!calendarDays) return; 

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    /**
     * Converts a 12-hour AM/PM time string to a 24-hour format string.
     * @param {string} timeString - e.g., "7:00 PM" or "9:30 AM".
     * @returns {string} The time in 24-hour format, e.g., "19:00" or "09:30".
     */
    function convertTo24Hour(timeString) {
        if (!timeString) return null;
        const [time, period] = timeString.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours, 10);

        if (period.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
            // Midnight case
            hours = 0;
        }
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    /**
     * Determines the correct UTC offset for a given date for the US Eastern Timezone.
     * @param {Date} date The date to check.
     * @returns {string} The UTC offset string ('-04:00' or '-05:00').
     */
    function getEasternTimezoneOffset(date) {
        const year = date.getFullYear();
        const edtStart = new Date(year, 2, 14 - new Date(year, 2, 1).getDay());
        const estStart = new Date(year, 10, 7 - new Date(year, 10, 1).getDay());
        return (date >= edtStart && date < estStart) ? '-04:00' : '-05:00';
    }


    function generateCalendar(month, year) {
        calendarDays.innerHTML = ''; 
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        let firstDayOfMonth = new Date(year, month, 1).getDay();
        let daysInMonth = new Date(year, month + 1, 0).getDate();
        let daysInPrevMonth = new Date(year, month, 0).getDate();

        // Previous month's days
        for (let i = firstDayOfMonth; i > 0; i--) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day-cell', 'other-month');
            const dayNumber = document.createElement('span');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = daysInPrevMonth - i + 1;
            dayCell.appendChild(dayNumber);
            calendarDays.appendChild(dayCell);
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day-cell');

            const dayNumber = document.createElement('span');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = day;
            dayCell.appendChild(dayNumber);

            const today = new Date();
            if (day === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
                dayCell.classList.add('today');
            }
            
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = eventsData.filter(e => e.date === dateString);

            if (dayEvents.length > 0) {
                dayEvents.forEach(event => {
                    const eventWrapper = document.createElement('a');
                    eventWrapper.classList.add('calendar-event');
                    eventWrapper.href = event.url;

                    const eventName = document.createElement('span');
                    eventName.classList.add('event-name-link');
                    eventName.textContent = event.name;

                    if (event.time) {
                        const time24 = convertTo24Hour(event.time);
                        const eventDateObj = new Date(event.date + 'T00:00:00');
                        const offset = getEasternTimezoneOffset(eventDateObj);
                        const isoString = `${event.date}T${time24}:00${offset}`;
                        const localDate = new Date(isoString);
                        
                        const eventTime = document.createElement('span');
                        eventTime.classList.add('event-time');
                        eventTime.textContent = localDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                        eventWrapper.appendChild(eventName);
                        eventWrapper.appendChild(eventTime);
                    } else {
                        eventWrapper.appendChild(eventName);
                    }

                    dayCell.appendChild(eventWrapper);
                });
            }

            calendarDays.appendChild(dayCell);
        }
    }

    function prevMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    }

    function nextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    }

    prevMonthBtn.addEventListener('click', prevMonth);
    nextMonthBtn.addEventListener('click', nextMonth);
    generateCalendar(currentMonth, currentYear);
});
