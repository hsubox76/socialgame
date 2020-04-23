import React, { useState, useEffect } from "react";
import { User, Post, Idea, PostResults } from "./types";
import "./App.css";

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
    follows: [],
    unfollows: [],
  };
  const replyThreshhold = 0.5;
  const shareThreshhold = 0.5;
  const followThreshhold = 0.75;
  const unfollowThreshhold = 0.5;
  for (const user of users) {
    // This can later get rolled into a composite score with fandomAlignment etc
    const politicsAlignment = post.politics.compare(user.politics);
    const scores = {
      reply: {
        positive: politicsAlignment * user.frequencies.reply.positive,
        negative: -politicsAlignment * user.frequencies.reply.negative,
      },
      share: {
        positive: politicsAlignment * user.frequencies.share.positive,
        negative: -politicsAlignment * user.frequencies.share.negative,
      },
      unfollow: -politicsAlignment * user.frequencies.unfollow,
    };
    if (scores.reply.positive > replyThreshhold) {
      results.reply.positive++;
    }
    if (scores.reply.negative > replyThreshhold) {
      results.reply.negative++;
    }
    if (scores.share.positive > shareThreshhold) {
      results.share.positive++;
      // assume every share exposes all of that user's followers and no overlap
      // this should be changed at some point
      const exposedUsers = generateUsers(user.followers);
      for (const exposedUser of exposedUsers) {
        const politicsAlignment = post.politics.compare(exposedUser.politics);
        const followScore = exposedUser.frequencies.follow * politicsAlignment;
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
  const [userStats, setUserStats] = useState<{ politicsBuckets?: number[] }>(
    {}
  );

  useEffect(() => {
    setUsers(generateUsers(20));
    setIdeas(generateIdeas(2));
  }, []);

  useEffect(() => {
    let buckets = [];
    for (let i = 0; i < 6; i++) {
      buckets[i] = users.filter(
        (user) => Math.floor(user.politics.slot) === i
      ).length;
    }
    setUserStats({ politicsBuckets: buckets });
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

  return (
    <div className="App">
      <h2>your followers</h2>
      <div>{users.length}</div>
      <h2>ideas</h2>
      {ideas.map((idea, index) => (
        <div key={index}>
          <div>
            idea {idea.id} | politics: {Math.round(idea.politics.slot * 100) / 100}
            <button onClick={() => postIdea(idea)}>make a post</button>
          </div>
        </div>
      ))}
      <h2>post</h2>
      {posts.map((post, index) => (
        <div key={index}>
          <div>
            post {index}: {post.content} | politics: {post.politics.slot}
          </div>
          <div>
            <div>reply</div>
            <div>positive: {post.results?.reply.positive}</div>
            <div>negative: {post.results?.reply.negative}</div>
            <div>share</div>
            <div>positive: {post.results?.share.positive}</div>
            <div>negative: {post.results?.share.negative}</div>
            <div>follows</div>
            <div>{post.results?.follows.length}</div>
            <div>unfollows</div>
            <div>{post.results?.unfollows.length}</div>
          </div>
        </div>
      ))}
      <h2>users</h2>
      <div>politics distribution:</div>
      <div>
      {userStats.politicsBuckets &&
        userStats.politicsBuckets.map((count, index: number) => (
          <div
            key={index}
            style={{ display: 'flex' }}
          >
            <div style={{ width: 20 }}>{index}</div>
            <div 
            style={{
              width: `${count * 10}px`,
              height: 20,
              color: "white",
              backgroundColor: "grey",
            }}></div>
          </div>
        ))}
        </div>
      {/* {users.map((user, index) => (
        <div key={index}>
          user {index}: politics ({user.politics.slot})
        </div>
      ))} */}
    </div>
  );
}

export default App;
