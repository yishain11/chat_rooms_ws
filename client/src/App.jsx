import { useEffect, useState, useRef } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [currentReciver, setCurrentReciver] = useState({});
  const [port, setPort] = useState(0);
  const [currentSocket, setCurrentSocket] = useState();
  const [msgs, setMsgs] = useState([]);
  const inputRef = useRef(null);

  function startChat(user) {
    console.log('starting chat with', user);
    setCurrentReciver(user);
    const headers = new Headers();
    headers.append('content-type', 'application/json');
    fetch('http://localhost:5321/startChat',
      { method: 'POST', headers, body: JSON.stringify({ currentUserId: currentUser.id, reciverUserId: user.id }) })
      .then(res => res.json())
      .then(res => {
        setPort(res.port);
        const ws = new WebSocket(`ws://localhost:${res.port}`);
        setCurrentSocket(ws);
      });
  }

  useEffect(() => {
    if (currentSocket) {
      console.log('new web socket!');
      currentSocket.onopen = (data) => {
        console.log("🟢🟢🟢  user connected  🟢🟢🟢");
      };

      currentSocket.onmessage = (e) => {
        const msg = e.data;
        console.log('msg', msg);
        try {
          const jsonMsg = JSON.parse(msg);
          const parsedMsg = JSON.parse(jsonMsg.msg);
          console.log('parsedMsg', parsedMsg);
          setMsgs((prev) => [...prev, parsedMsg]);
        } catch (error) {
          setMsgs((prev) => [...prev, msg]);

        }
      };

      currentSocket.onerror = (error) => {
        console.log("⛔⛔⛔ Following  Error ocurred ⛔⛔⛔", error);
      };
    }

  }, [currentSocket]);

  useEffect(() => {
    fetch('http://localhost:5321/users')
      .then(res => res.json())
      .then(res => {
        const idx = Math.floor(Math.random() * res.users.length);
        setCurrentUser(res.users[idx]);
        const users = res.users.toSpliced(idx, 1);
        setUsers(users);
      });
  }, []);

  return <>
    <h1>my details</h1>
    <div>
      {Object.keys(currentUser).map((key, i) => <p key={i}> <strong>{key}</strong>: {currentUser[key]}</p>)}
    </div>
    <h2>avaialable users</h2>
    <div>
      {users.map(user => {
        return <button key={user.id} onClick={() => {
          startChat(user);
        }}>{user.name}</button>;
      })}
    </div>
    <h3>talking with: {currentReciver.name} on port: {port}</h3>
    <h2>chat</h2>
    <input ref={inputRef} type="text" />
    <button onClick={() => {
      currentSocket.send(JSON.stringify({ msg: inputRef.current.value, sender: currentUser, reciver: currentReciver }));
    }}>send</button>
    <h2>messages</h2>
    <div>
      {msgs.map((msg, i) => {
        if (msg && msg.sender && msg.reciver) {
          return <div key={i} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            <div>from: {msg.sender.name}</div>
            <div>to: {msg.reciver.name}</div>
            <div>msg: {msg.msg}</div>
          </div>;
        } else {
          <></>;
        }
      })}
    </div>
  </>;
}

export default App;
