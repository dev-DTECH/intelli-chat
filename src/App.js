import React, {useRef, useState, Component} from 'react';
import './App.css';
import io from 'socket.io-client'

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'
import 'firebase/firestore';
import {getAuth, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import 'firebase/analytics';

import {useAuthState, useSignInWithGoogle} from 'react-firebase-hooks/auth';
import {useCollectionData} from 'react-firebase-hooks/firestore';
import {initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";

let socket
// socket.emit("ping")
const firebaseConfig = {
    apiKey: "AIzaSyAqY2IJXJqf9cgaApnF2rs5ur7sDsP0LU4",
    authDomain: "intellichat-32022.firebaseapp.com",
    projectId: "intellichat-32022",
    storageBucket: "intellichat-32022.appspot.com",
    messagingSenderId: "729039606167",
    appId: "1:729039606167:web:0b6e9a08d4cb3906d734d2",
    measurementId: "G-8QSV8ZWF5E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// console.log(app)
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const firestore = firebase.firestore;

function App() {
    const [user, loading, error] = useAuthState(auth);
    if (user) {
        socket = io(`ws://localhost:3000`, {
            reconnectionDelayMax: 10000,
        });
        socket.emit("login", {
            name: user.displayName,
            uid: user.uid,
            email: user.email

        })
    }

    return (
        <div className="App">
            <header>
                <h1>🧠intelliChat</h1>
                <SignOut/>
            </header>

            <section>
                {user ? <ChatRoom/> : <SignIn/>}
            </section>

        </div>
    );
}

function SignIn() {
    const [signInWithGoogle, user, loading, error] = useSignInWithGoogle(auth);

    return (
        <>
            <button className="sign-in" onClick={() => signInWithGoogle()}>Sign in with Google</button>
        </>
    )

}

function SignOut() {
    return auth.currentUser && (
        <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
    )
}

class ChatRoom extends Component {

    constructor(props) {

        super(props);
        this.dummyRef = React.createRef();
        this.textRef = React.createRef();
        this.sendMessage = this.sendMessage.bind(this);
        this.typeMessage = this.typeMessage.bind(this);
        this.state = {
            messages: [],
            formValue: ""
        }
    }

    sendMessage(e) {
        e.preventDefault();
        console.log(this.state)

        const {uid, displayName, photoURL} = auth.currentUser;
        socket.emit("message", {
            user: displayName,
            message: this.state.formValue
        })
        this.state.messages.push({
            text: this.state.formValue,
            // createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            uid,
            photoURL
        })
        this.textRef.current.value = ""
        this.state.formValue = ""
        this.setState(prevState => {
            return this.state;
        })
        this.dummyRef.current.scrollIntoView({behavior: 'smooth'});
    }

    typeMessage(e) {
        e.preventDefault();
        this.state.formValue = e.target.value;
        this.setState(prevState => {
            return this.state;
        })
        console.log(this.state)
    }

    render() {


        // const dummy = useRef();


        return (<>
            <main>
                {this.state.messages && this.state.messages.map((msg, i) => <ChatMessage key={i} message={msg}/>)}

                <span ref={this.dummyRef}/>

            </main>

            <form onSubmit={this.sendMessage}>

                <input ref={this.textRef} onChange={this.typeMessage}
                       placeholder="say something nice"/>

                <button type="submit" disabled={!this.state.formValue}>💬</button>

            </form>
        </>)
    }
}

function ChatMessage(props) {
    const {text, uid, photoURL} = props.message;

    const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

    return (<>
        <div className={`message ${messageClass}`}>
            <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'}/>
            <p>{text}</p>
        </div>
    </>)
}

export default App;
