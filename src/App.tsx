/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useState, useEffect } from "react";
import { User, Post, Idea, PostResults } from "./types";
import "./App.css";

const politicsEmojis = ["🏝", "📱", "🧲", "🔗", "🌋", "🚌"];
const fandomEmojis = ["🍉", "🐷", "🏀", "🍿", "🌞", "🌧"];

function generateUsers(numUsers: number) {
  const users = [];
  for (let i = 0; i < numUsers; i++) {
    users.push(new User());
  }
  return users;
}

function generateIdeas(numIdeas: number) {
  const ideas = [];
  for (let i = 0; i < numIdeas; i++) {
    ideas.push(new Idea());
  }
  return ideas;
}

function getUserReactions(post: Post, users: User[]) {
  const results: PostResults = {
    reply: { negative: 0, positive: 0 },
    share: { negative: 0, positive: 0 },
    like: 0,
    follows: [],
    unfollows: [],
  };
  const likeThreshhold = 0.5;
  const replyThreshhold = 0.5;
  const shareThreshhold = 0.5;
  const followThreshhold = 0.6;
  const unfollowThreshhold = 0.5;
  for (const user of users) {
    // This can later get rolled into a composite score with fandomAlignment etc
    const politicsAlignment = post.politics.compare(user.politics);
    const fandomAlignment = post.politics.compare(user.fandom);
    const compositeAlignment = (politicsAlignment + fandomAlignment) / 2;
    const scores = {
      reply: {
        positive: compositeAlignment * user.frequencies.reply.positive,
        negative: -compositeAlignment * user.frequencies.reply.negative,
      },
      share: {
        positive: compositeAlignment * user.frequencies.share.positive,
        negative: -compositeAlignment * user.frequencies.share.negative,
      },
      unfollow: -compositeAlignment * user.frequencies.unfollow,
      like: compositeAlignment * user.frequencies.like,
    };
    if (scores.reply.positive > replyThreshhold) {
      results.reply.positive++;
    }
    if (scores.reply.negative > replyThreshhold) {
      results.reply.negative++;
    }
    if (scores.like > likeThreshhold) {
      results.like++;
    }
    if (scores.share.positive > shareThreshhold) {
      results.share.positive++;
      // assume every share exposes all of that user's followers and no overlap
      // this should be changed at some point
      const exposedUsers = generateUsers(user.followers);
      for (const exposedUser of exposedUsers) {
        const compositeAlignment = post.politics.compare(exposedUser.politics);
        const followScore = exposedUser.frequencies.follow * compositeAlignment;
        if (followScore > followThreshhold) {
          results.follows.push(exposedUser);
        }
      }
    }
    if (scores.share.negative > shareThreshhold) {
      results.share.negative++;
    }
    if (scores.unfollow > unfollowThreshhold) {
      results.unfollows.push(user.id);
    }
  }
  return results;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [userStats, setUserStats] = useState<{ [key: string]: number[] }>({});

  useEffect(() => {
    setUsers(generateUsers(20));
    setIdeas(generateIdeas(5));
  }, []);

  useEffect(() => {
    if (users.length === 0) {
      return;
    }
    let politicsBuckets = [];
    let fandomBuckets = [];
    for (let i = 0; i < 6; i++) {
      politicsBuckets[i] = users.filter(
        (user) => Math.floor(user.politics.slot) === i
      ).length;
      fandomBuckets[i] = users.filter(
        (user) => Math.floor(user.fandom.slot) === i
      ).length;
    }
    setUserStats({ politicsBuckets, fandomBuckets });
  }, [users]);

  function postIdea(idea: Idea) {
    const ideaId = idea.id;
    const newPost: Post = new Post(idea);
    newPost.results = getUserReactions(newPost, users);
    let updatedUsers = users;
    if (newPost.results.follows.length) {
      updatedUsers = updatedUsers.concat(newPost.results.follows);
    }
    if (newPost.results.unfollows.length) {
      updatedUsers = updatedUsers.filter(
        (user) => !newPost.results?.unfollows.includes(user.id)
      );
    }
    if (updatedUsers !== users) {
      setUsers(updatedUsers);
    }
    setPosts(posts.concat(newPost));
    setIdeas(ideas.filter((idea) => idea.id !== ideaId).concat(new Idea()));
  }

  function drawChart(counts: number[], emojis: string[]) {
    const size = 250;
    const numWedges = 6;
    const colors = ["red", "orange", "yellow", "green", "blue", "purple"];
    const wedges = [];
    const labels = [];
    const maxCount = counts.reduce((max, count) => Math.max(max, count), 0);
    for (let i = 0; i < numWedges; i++) {
      const count = counts[i];
      const relativeSize = (size * count) / maxCount;
      wedges.push(
        <circle
          key={i}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          r={relativeSize / 4}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          stroke={colors[i]}
          strokeWidth={relativeSize / 2}
          strokeDasharray={`${((1 / numWedges) * Math.PI * relativeSize) / 2} ${
            (Math.PI * relativeSize) / 2
          }`}
          transform={`rotate(${(360 * i) / numWedges - 180})`}
        />
      );
      const radius = size / 4;
      const cartesianX = radius * Math.cos(-(2 * Math.PI * i) / numWedges - Math.PI - Math.PI / numWedges);
      const cartesianY = radius * Math.sin(-(2 * Math.PI * i) / numWedges - Math.PI - Math.PI / numWedges);
      const x = size / 2 + cartesianX;
      const y = size / 2 - cartesianY;
      labels.push(
        <g key={i}>
          <circle cx={x} cy={y} r={20} fill="white" fillOpacity="0.6" />
          <text
            x={x}
            y={y}
            alignmentBaseline="middle"
            textAnchor="middle"
            style={{ font: "bold 30px sans-serif" }}
          >
          {emojis[i]}
          </text>
          </g>
      );
    }
    return (
      <svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        <circle r={size / 2} cx={size / 2} cy={size / 2} fill="white" />
        {wedges}
        {labels}
      </svg>
    );
  }

  return (
    <div className="App">
      <h2>your followers</h2>
      <div>{users.length}</div>
      <h2>ideas</h2>
      {ideas.map((idea, index) => (
        <div key={index}>
          <div className="idea-box">
            idea {idea.id} | politics:{" "}
            {politicsEmojis[Math.floor(idea.politics.slot)]} | fandom:{" "}
            {fandomEmojis[Math.floor(idea.fandom.slot)]}
            <button onClick={() => postIdea(idea)}>make a post</button>
          </div>
        </div>
      ))}
      <h2>post</h2>
      {posts.map((post, index) => (
        <div key={index}>
          <div>
            post {index}: politics: {post.politics.slot}
          </div>
          <div className="flex spacey">
            <div className="flex spacey boxy">
              <div>reply</div>
              <div>+{post.results?.reply.positive}</div>
              <div>-{post.results?.reply.negative}</div>
            </div>
            <div className="flex spacey boxy">
              <div>share</div>
              <div>+{post.results?.share.positive}</div>
              <div>-{post.results?.share.negative}</div>
            </div>
            <div className="flex spacey boxy">
              <div>like</div>
              <div>{post.results?.like}</div>
            </div>
            <div className="flex spacey boxy">
              <div>follows</div>
              <div>{post.results?.follows.length}</div>
            </div>
            <div className="flex spacey boxy">
              <div>unfollows</div>
              <div>{post.results?.unfollows.length}</div>
            </div>
          </div>
        </div>
      ))}
      <h2>users</h2>
      <div>politics distribution:</div>
      <div>
        {userStats.politicsBuckets && drawChart(userStats.politicsBuckets, politicsEmojis)}
      </div>
      <div>fandom distribution:</div>
      <div>{userStats.fandomBuckets && drawChart(userStats.fandomBuckets, fandomEmojis)}</div>
    </div>
  );
}

export default App;
