import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import ReactPlayer from 'react-player';
import './App.css';

const socket = io('http://localhost:8000');

function App() {
  const [roomId, setRoomId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef(null);

  const handlePlay = () => {
    socket.emit('play-video', roomId, playerRef.current.getCurrentTime());
  };

  const handlePause = () => {
    socket.emit('pause-video', roomId, playerRef.current.getCurrentTime());
  };

  const handleSeek = (seconds) => {
    socket.emit('seek-video', roomId, seconds);
  };

  useEffect(() => {
    socket.on('receive-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user-connected', (username) => {
      setMessages(prev => [...prev, {
        text: `${username} joined`,
        sender: 'System',
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    socket.on('user-disconnected', (username) => {
      setMessages(prev => [...prev, {
        text: `${username} left`,
        sender: 'System',
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    socket.on('update-users', (users) => {
      setUsers(users);
    });
    socket.on('play-video', (time) => {
      setIsPlaying(true);
      setCurrentTime(time);
      playerRef.current.seekTo(time);
    });

    socket.on('pause-video', (time) => {
      setIsPlaying(false);
      setCurrentTime(time);
      playerRef.current.seekTo(time);
    });

    socket.on('seek-video', (time) => {
      setCurrentTime(time);
      playerRef.current.seekTo(time);
    });

    socket.on('sync-playback', (roomData) => {
      setIsPlaying(roomData.isPlaying);
      setCurrentTime(roomData.currentTime);
      playerRef.current.seekTo(roomData.currentTime);
    });

    return () => {
      socket.off('play-video');
      socket.off('pause-video');
      socket.off('seek-video');
      socket.off('sync-playback');
    };
  }, []);

  const joinRoom = () => {
    if (roomId.trim()) {
      socket.emit('join-room', roomId);
    }
  };

  return (
    <div className="app">
      <h1>Couple Movie Night</h1>
      <div className="controls">
        <div className="auth-controls">
          <input
            type="text"
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
        <input
          type="text"
          placeholder="Video URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
      </div>
      <div className="chat-container">
        <div className="users-list">
          <h3>Watching Together</h3>
          <ul>
            {users.map((user, i) => (
              <li key={i}>{user}</li>
            ))}
          </ul>
        </div>
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className="message">
              <span className="timestamp">{msg.timestamp}</span>
              <span className="sender">{msg.sender}:</span>
              <span className="text">{msg.text}</span>
            </div>
          ))}
        </div>
        <div className="message-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
      <div className="player-wrapper">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={isPlaying}
          controls
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
}

export default App;
