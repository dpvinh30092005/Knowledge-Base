const storyData = [
  {
    title: "My Story",
    decs: "The journey form a curious leaner to a Backend Developer.",
  },

  {
    title: "The vision",
    decs: "Stay curious, keep discovering.",
  },

  {
    title: "The Tech",
    decs: "Committed to mastering Java Backend Engineering from refining complex business logic to optimizing database interactions.",
  },
];

function updateStory(index) {
  //Update the story title and description based on the index
  document.getElementById("story-title").textContent = storyData[index].title;
  document.getElementById("story-decs").textContent = storyData[index].decs;
  // Update the active state of the line
  const lines = document.querySelectorAll(".line-item");
  lines.forEach((line, i) => {
    if (i === index) {
      line.classList.add("active");
    } else {
      line.classList.remove("active");
    }
  });
}

function toggleMusic() {
  const music = document.getElementById("myMusic");
  const headphone = document.getElementById("headphone");

  if (music.paused) {
    music.play();
    headphone.classList.add("is-shaking");

} else {
    music.pause();
    music.currentTime = 0; 
    headphone.classList.remove("is-shaking");
  }
}
