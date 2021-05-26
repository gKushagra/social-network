export interface User {
    id: string,
    email: string
}

export interface Contact {
    contactOwnerId: string,
    contactUserId: string,
    contactUserEmail: string
}