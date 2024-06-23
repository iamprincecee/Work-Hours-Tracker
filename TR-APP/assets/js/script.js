document.addEventListener('DOMContentLoaded', () => {
    const addTaskButton = document.getElementById('add-task');
    const customTimeModal = document.getElementById('custom-time-modal');
    const customTimeForm = document.getElementById('custom-time-form');
    const taskList = document.getElementById('task-list');
    const dailyCumulative = document.getElementById('daily-cumulative');
    const monthlyCumulative = document.getElementById('monthly-cumulative');
    const recordsList = document.getElementById('records-list');
    const exportDailyButton = document.getElementById('export-daily');
    const exportMonthlyButton = document.getElementById('export-monthly');
    const updateRecordsButton = document.getElementById('update-records-btn');
    const updateRecordsModal = document.getElementById('update-records-modal');
    const updateRecordsForm = document.getElementById('update-records-form');
    const addMoreTasksButton = document.getElementById('add-more-tasks');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let dailyRecords = JSON.parse(localStorage.getItem('dailyRecords')) || {};
    let monthlyRecords = JSON.parse(localStorage.getItem('monthlyRecords')) || {};

    const saveData = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('dailyRecords', JSON.stringify(dailyRecords));
        localStorage.setItem('monthlyRecords', JSON.stringify(monthlyRecords));
    };

    const getCurrentDateKey = () => {
        const now = new Date();
        if (now.getHours() < 1) {
            now.setDate(now.getDate() - 1);
        }
        return now.toISOString().split('T')[0];
    };

    const calculateTime = (minutes, seconds, count) => {
        const totalSeconds = (minutes * 60 + seconds) * count;
        const hours = Math.floor(totalSeconds / 3600);
        const minutesRemaining = Math.floor((totalSeconds % 3600) / 60);
        const secondsRemaining = totalSeconds % 60;
        return { hours, minutes: minutesRemaining, seconds: secondsRemaining };
    };

    const updateCumulative = () => {
        let dailyTotal = { hours: 0, minutes: 0, seconds: 0 };
        tasks.forEach(task => {
            const { minutes, seconds, count } = task;
            const taskTotal = calculateTime(minutes, seconds, count);
            dailyTotal.hours += taskTotal.hours;
            dailyTotal.minutes += taskTotal.minutes;
            dailyTotal.seconds += taskTotal.seconds;
        });

        dailyTotal.minutes += Math.floor(dailyTotal.seconds / 60);
        dailyTotal.seconds %= 60;
        dailyTotal.hours += Math.floor(dailyTotal.minutes / 60);
        dailyTotal.minutes %= 60;

        dailyCumulative.textContent = `Daily Total: ${dailyTotal.hours}hrs ${dailyTotal.minutes}mins ${dailyTotal.seconds}secs`;

        const currentDateKey = getCurrentDateKey();
        dailyRecords[currentDateKey] = {
            tasks,
            total: dailyTotal
        };

        let monthlyTotal = { hours: 0, minutes: 0, seconds: 0 };
        Object.values(dailyRecords).forEach(record => {
            monthlyTotal.hours += record.total.hours;
            monthlyTotal.minutes += record.total.minutes;
            monthlyTotal.seconds += record.total.seconds;
        });

        monthlyTotal.minutes += Math.floor(monthlyTotal.seconds / 60);
        monthlyTotal.seconds %= 60;
        monthlyTotal.hours += Math.floor(monthlyTotal.minutes / 60);
        monthlyTotal.minutes %= 60;

        monthlyCumulative.textContent = `Monthly Total: ${monthlyTotal.hours}hrs ${monthlyTotal.minutes}mins ${monthlyTotal.seconds}secs`;

        monthlyRecords[getCurrentDateKey().slice(0, 7)] = monthlyTotal;
        saveData();
    };

    const createTaskRow = task => {
        const row = document.createElement('div');
        row.className = 'task-row';

        const nameCell = document.createElement('div');
        nameCell.textContent = task.name;
        row.appendChild(nameCell);

        const timeCell = document.createElement('div');
        timeCell.textContent = `${task.minutes}m ${task.seconds}s`;
        row.appendChild(timeCell);

        const countInput = document.createElement('input');
        countInput.type = 'number';
        countInput.value = task.count;
        countInput.addEventListener('change', () => {
            task.count = parseInt(countInput.value, 10);
            updateCumulative();
        });
        row.appendChild(countInput);

        const incrementButton = document.createElement('button');
        incrementButton.textContent = '+';
        incrementButton.addEventListener('click', () => {
            task.count += 1;
            countInput.value = task.count;
            updateCumulative();
        });
        row.appendChild(incrementButton);

        const decrementButton = document.createElement('button');
        decrementButton.textContent = '-';
        decrementButton.addEventListener('click', () => {
            if (task.count > 0) {
                task.count -= 1;
                countInput.value = task.count;
                updateCumulative();
            }
        });
        row.appendChild(decrementButton);

        return row;
    };

    const renderTasks = () => {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const row = createTaskRow(task);
            taskList.appendChild(row);
        });
    };

    const renderRecords = () => {
        recordsList.innerHTML = '';
        Object.entries(dailyRecords).forEach(([date, record]) => {
            const recordDiv = document.createElement('div');
            recordDiv.className = 'record';

            const recordHeader = document.createElement('h3');
            recordHeader.textContent = `Date: ${date} || Daily Total: ${record.total.hours}hrs ${record.total.minutes}mins ${record.total.seconds}secs`;
            recordDiv.appendChild(recordHeader);

            record.tasks.forEach(task => {
                const taskDetail = document.createElement('p');
                taskDetail.textContent = `${task.name} -> ${task.minutes}m ${task.seconds}s - ${task.count}`;
                recordDiv.appendChild(taskDetail);
            });

            recordsList.appendChild(recordDiv);
        });
    };

    customTimeForm.addEventListener('submit', event => {
        event.preventDefault();
        const name = document.getElementById('task-name').value;
        const minutes = parseInt(document.getElementById('task-minutes').value, 10);
        const seconds = parseInt(document.getElementById('task-seconds').value, 10);

        const newTask = { name, minutes, seconds, count: 0 };
        tasks.push(newTask);

        const row = createTaskRow(newTask);
        taskList.appendChild(row);

        customTimeForm.reset();
        customTimeModal.style.display = 'none';
        updateCumulative();
    });

    addTaskButton.addEventListener('click', () => {
        customTimeModal.style.display = 'block';
    });

    exportDailyButton.addEventListener('click', () => {
        const currentDateKey = getCurrentDateKey();
        const record = dailyRecords[currentDateKey];
        let data = `Date: ${currentDateKey} || Daily Total: ${record.total.hours}hrs ${record.total.minutes}mins ${record.total.seconds}secs\n`;
        record.tasks.forEach(task => {
            data += `${task.name} -> ${task.minutes}m ${task.seconds}s - ${task.count}\n`;
        });

        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentDateKey}-daily-record.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    exportMonthlyButton.addEventListener('click', () => {
        const currentMonthKey = getCurrentDateKey().slice(0, 7);
        const monthlyTotal = monthlyRecords[currentMonthKey];
        let data = `Monthly Total: ${monthlyTotal.hours}hrs ${monthlyTotal.minutes}mins ${monthlyTotal.seconds}secs\n\n`;

        Object.entries(dailyRecords).forEach(([date, record]) => {
            data += `Date: ${date} || Daily Total: ${record.total.hours}hrs ${record.total.minutes}mins ${record.total.seconds}secs\n`;
            record.tasks.forEach(task => {
                data += `${task.name} -> ${task.minutes}m ${task.seconds}s - ${task.count}\n`;
            });
            data += '\n';
        });

        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentMonthKey}-monthly-record.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    updateRecordsButton.addEventListener('click', () => {
        updateRecordsModal.style.display = 'block';
    });

    addMoreTasksButton.addEventListener('click', () => {
        const taskInput = document.createElement('div');
        taskInput.className = 'task-input';

        const taskNameInput = document.createElement('input');
        taskNameInput.type = 'text';
        taskNameInput.placeholder = 'Task Name';
        taskInput.appendChild(taskNameInput);

        const taskMinutesInput = document.createElement('input');
        taskMinutesInput.type = 'number';
        taskMinutesInput.placeholder = 'Minutes';
        taskMinutesInput.min = '1';
        taskMinutesInput.max = '60';
        taskInput.appendChild(taskMinutesInput);

        const taskSecondsInput = document.createElement('input');
        taskSecondsInput.type = 'number';
        taskSecondsInput.placeholder = 'Seconds';
        taskSecondsInput.min = '0';
        taskSecondsInput.max = '59';
        taskInput.appendChild(taskSecondsInput);

        const taskCountInput = document.createElement('input');
        taskCountInput.type = 'number';
        taskCountInput.placeholder = 'Count';
        taskCountInput.min = '0';
        taskInput.appendChild(taskCountInput);

        document.getElementById('update-tasks-container').appendChild(taskInput);
    });

    updateRecordsForm.addEventListener('submit', event => {
        event.preventDefault();
        const date = document.getElementById('record-date').value;
        const taskInputs = document.querySelectorAll('.task-input');
        const newTasks = [];

        taskInputs.forEach(taskInput => {
            const name = taskInput.children[0].value;
            const minutes = parseInt(taskInput.children[1].value, 10);
            const seconds = parseInt(taskInput.children[2].value, 10);
            const count = parseInt(taskInput.children[3].value, 10);

            newTasks.push({ name, minutes, seconds, count });
        });

        let dailyTotal = { hours: 0, minutes: 0, seconds: 0 };
        newTasks.forEach(task => {
            const taskTotal = calculateTime(task.minutes, task.seconds, task.count);
            dailyTotal.hours += taskTotal.hours;
            dailyTotal.minutes += taskTotal.minutes;
            dailyTotal.seconds += taskTotal.seconds;
        });

        dailyTotal.minutes += Math.floor(dailyTotal.seconds / 60);
        dailyTotal.seconds %= 60;
        dailyTotal.hours += Math.floor(dailyTotal.minutes / 60);
        dailyTotal.minutes %= 60;

        dailyRecords[date] = {
            tasks: newTasks,
            total: dailyTotal
        };

        renderRecords();
        updateRecordsModal.style.display = 'none';
        updateCumulative();
    });

    window.onclick = event => {
        if (event.target === customTimeModal) {
            customTimeModal.style.display = 'none';
        }
        if (event.target === updateRecordsModal) {
            updateRecordsModal.style.display = 'none';
        }
    };

    document.querySelectorAll('.close').forEach(closeButton => {
        closeButton.onclick = () => {
            customTimeModal.style.display = 'none';
            updateRecordsModal.style.display = 'none';
        };
    });

    renderTasks();
    renderRecords();
    updateCumulative();
});
