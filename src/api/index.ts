import type { Monitor } from "@interfaces/index"


export const getMonitors = async () => {
    const response = await fetch('http://localhost:3000/monitors')
    if (!response.ok) {
        throw new Error('Network response was not ok')
    }
    return response.json()
}


export const updateMonitor = async (monitor: Monitor) => {
    const response = await fetch(`http://localhost:3000/monitors/${monitor.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(monitor),
    })
    if (!response.ok) {
        throw new Error('Network response was not ok')
    }
    return response.json()
}

export const deleteMonitor = async (id: number) => {
    const response = await fetch(`http://localhost:3000/monitors/${id}`, {
        method: 'DELETE',
    })
    if (!response.ok) {
        throw new Error('Network response was not ok')
    }
    return response.json()
}

export const createMonitor = async (monitor: Monitor) => {
    const response = await fetch(`http://localhost:3000/monitors`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(monitor),
    })
    if (!response.ok) {
        throw new Error('Network response was not ok')
    }
    return response.json()
}

export const getMonths = async () => {
    const response = await fetch('http://localhost:3000/months')
    if (!response.ok) {
        throw new Error('Network response was not ok')
    }
    return response.json()
}

export const getWaters = async () => {
    const response = await fetch('http://localhost:3000/waters')
    if (!response.ok) {
        throw new Error('Network response was not ok')
    }
    return response.json()
}
