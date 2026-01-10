const isAdmin = (s: string) => {
    if (s === 'admin') {
        return true
    }

    return false
}

export default isAdmin