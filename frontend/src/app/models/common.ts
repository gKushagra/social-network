export interface User {
    id: string,
    email: string
}

export interface Contact {
    contactOwnerId: string,
    contactUserId: string,
    contactUserEmail: string
}

export interface Request {
    requestId: string,
    fromUserId: string,
    toUserId: string,
    status: boolean
}

export interface Post {
    postId: string,
    postOwnerId: string,
    postHtmlContent: string,
    postFileLink: string,
    postExternalLink: string,
    postDate: Date,
    postComments: any
}