function calculateProgress(completed, total) {
    let percent = 0;

    if (total === 0) {
        return percent;
    }

    percent = (completed/total) * 100;
    percent = Math.round(percent/5) * 5;

    if (percent > 100) {
        percent = 100;
    }

    return percent;
}

export { calculateProgress };
