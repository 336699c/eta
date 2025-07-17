class ETA {
    constructor() {
        this.ETAs = [];
        this.ETAID = 0;
    }

    /**
     * Get an ETA data object by its ID
     * @param {number} id - The ID of the ETA data object
     * @returns {Object} The ETA data object
     */
    getETA(id) {
        return this.ETAs.find(eta => eta.id === id);
    }

    /**
     * Push a new ETA data object
     * @param {Object} eta - The new ETA data object
     */
    pushETA(eta) {
        eta.id = this.ETAID++;
        this.ETAs.push(eta);
    }

    /**
     * Fetch the ETA data from API asynchronously
     * @param {string} url - The URL of the API
     * @param {function} callback - The callback function
     */
    fetch(url, callback) {
        fetch(url)
            .then(response => response.json())
            .then(data => callback(data));
    }

    /**
     * Remove the ETA data that is older than 1 minute
     */
    filterETA() {
        this.ETAs = this.ETAs.filter(eta => {
            const now = new Date().getTime();
            const etaTime = new Date(eta.eta).getTime();
            return etaTime - now <= 60000;
        });
    }

}
