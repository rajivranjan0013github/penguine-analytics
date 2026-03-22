const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const getDateString = (date) => {
    const istDate = new Date(date.getTime() + IST_OFFSET);
    return istDate.toISOString().split('T')[0];
};

const fillMissingDates = (data, days) => {
    const result = [];
    const dataMap = new Map(data.map(d => [d._id, d.count]));

    console.log("Current System Time:", new Date().toISOString());
    console.log("Current IST Time:", new Date(new Date().getTime() + IST_OFFSET).toISOString());

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = getDateString(date);
        result.push({
            date: dateStr,
            count: dataMap.get(dateStr) || 0
        });
    }
    return result;
};

// Simulation
const days = 7;
const mockData = [];
const trends = fillMissingDates(mockData, days);
console.log("Generated Trends:");
console.table(trends);

const formatter = (val) => val.split('-').slice(1).join('/');
console.log("Formatted dates for XAxis:");
trends.forEach(t => {
    console.log(`${t.date} -> ${formatter(t.date)}`);
});
