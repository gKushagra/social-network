class Store {

    activeUsers = [];

    constructor() { }

    addActiveUser(data) {
        this.activeUsers.push(data);
    }

    removeActiveUser(id) {
        this.activeUsers = this.activeUsers.filter(user => {
            return user.id !== id
        });
    }
}

module.exports = {
    Store: Store
}