
interface UserContructor {
    id: string;
    name: string;
    email: string;
    password: string;
}

interface UserCreateForm {
    name: string;
    email: string;
    password: string;
}

class User {

    id: string;
    name: string;
    email: string;
    password: string;

    constructor(form: UserContructor) {
        this.id = form.id;
        this.name = form.name;
        this.email = form.email;
        this.password = form.password;
    }

    static create(form: UserCreateForm) {
        const id = crypto.randomUUID(); // Todo trocar para uuidV4 ou outro mais especifico
        return new User({ id, ...form });
    }
}