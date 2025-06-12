import React from "react";
import "./StudyTechniques.css";
import StudyHubNavbar from '../../components/StudyHubNavbar';

const StudyTechniques = () => {
  return (
    <div className="full-page">
      <StudyHubNavbar />
      <div className="techniques-container">
        <h1 className="techniques-title">📚 Essential Study & Productivity Techniques</h1>

        {/* Pomodoro Technique */}
        <div className="lesson-block">
          <h2 className="lesson-title">⏲️ Pomodoro Technique</h2>
          <p className="lesson-text">
            <b>Introduction:</b><br/>
            The Pomodoro Technique is a time management strategy created by Francesco Cirillo in the late 1980s. It's named after the tomato-shaped kitchen timer he used as a university student.<br/><br/>

            <b>How It Works:</b><br/>
            - Set a timer for 25 minutes (this is called one Pomodoro).<br/>
            - Focus on a single task with zero distractions.<br/>
            - When the timer rings, take a 5-minute break.<br/>
            - After completing 4 Pomodoros, take a longer break of 15–30 minutes.<br/><br/>

            <b>Why It Works:</b><br/>
            - Reduces mental fatigue<br/>
            - Increases motivation<br/>
            - Builds a habit of deep work<br/><br/>

            <b>Example:</b><br/>
            Studying for a biology exam:<br/>
            1st Pomodoro – Review lecture notes<br/>
            2nd Pomodoro – Watch a topic video<br/>
            3rd Pomodoro – Take self-quiz<br/>
            4th Pomodoro – Revise weak areas<br/><br/>

            <img className="lesson-image" src="https://bharatividyapeethonline.com/wp-content/uploads/2024/04/Picture2.png" alt="Pomodoro Diagram"/>
          </p>
          <div className="video-embed">
            <iframe src="https://www.youtube.com/embed/mNBmG24djoY" title="Pomodoro Technique" allowFullScreen></iframe>
          </div>
        </div>

        {/* Time Blocking */}
        <div className="lesson-block">
          <h2 className="lesson-title">📅 Time Blocking</h2>
          <p className="lesson-text">
            <b>What is Time Blocking?</b><br/>
            Time Blocking is the practice of scheduling every part of your day, including rest, deep work, and admin tasks.<br/><br/>

            <b>How to Apply:</b><br/>
            - Break your day into 30 or 60-minute blocks.<br/>
            - Allocate specific tasks or themes to each block.<br/>
            - Review and adjust blocks at the end of each day.<br/><br/>

            <b>Example:</b><br/>
            8:00–9:00 – Planning & Emails<br/>
            9:00–11:00 – Project Development<br/>
            11:00–12:00 – Meeting<br/>
            1:00–3:00 – Study Session<br/>
            3:00–4:00 – Admin/Errands<br/><br/>

            <b>Tip:</b> Use digital calendars like Google Calendar or tools like Notion.<br/><br/>
            <img className="lesson-image" src="https://plan.io/images/blog/time-blocking-benefits.png?1748428880" alt="Time Blocking Example"/>
          </p>
          <div className="video-embed">
            <iframe src="https://www.youtube.com/embed/Fode0CHwnOA" title="Time Blocking" allowFullScreen></iframe>
          </div>
        </div>

        {/* Eisenhower Matrix */}
        <div className="lesson-block">
          <h2 className="lesson-title">🧠 Eisenhower Matrix</h2>
          <p className="lesson-text">
            <b>Concept:</b><br/>
            Developed by U.S. President Dwight D. Eisenhower, this technique helps you prioritize tasks by urgency and importance.<br/><br/>

            <b>The Matrix:</b><br/>
            Quadrant 1 – Urgent & Important → Do it now<br/>
            Quadrant 2 – Important, Not Urgent → Schedule it<br/>
            Quadrant 3 – Urgent, Not Important → Delegate it<br/>
            Quadrant 4 – Neither Urgent nor Important → Eliminate it<br/><br/>

            <b>Example:</b><br/>
            - Submit assignment due today → Q1<br/>
            - Prepare for next week's test → Q2<br/>
            - Answer random call → Q3<br/>
            - Watch reels aimlessly → Q4<br/><br/>

            <img className="lesson-image" src="https://assets.asana.biz/transform/30c95d26-15e1-4df1-9655-27b28186f0f2/inline-leadership-eisenhower-matrix-2-2x" alt="Eisenhower Matrix"/>
          </p>
          <div className="video-embed">
            <iframe src="https://www.youtube.com/embed/tT89OZ7TNwc" title="Eisenhower Matrix" allowFullScreen></iframe>
          </div>
        </div>

        {/* Cajun Koi Method */}
        <div className="lesson-block">
          <h2 className="lesson-title">🌊 The Cajun Koi Method</h2>
          <p className="lesson-text">
            <b>About the Method:</b><br/>
            Created by the Cajun Koi Academy, this technique emphasizes sustainable productivity and emotional well-being.<br/><br/>

            <b>How It Works:</b><br/>
            - Focus on building habits gradually<br/>
            - Avoid perfectionism and celebrate small wins<br/>
            - Reflect on your emotional state regularly<br/><br/>

            <b>Example:</b><br/>
            Instead of cramming all night, aim to study 1 hour/day for a week with deep focus.<br/><br/>

            <b>Quote:</b> "Win the day with small victories."
            <br/><br/>
            <img className="lesson-image" src="https://i0.wp.com/edefficiency.com/wp-content/uploads/2024/04/image-3.png?w=1024&ssl=1" alt="Cajun Koi Method"/>
          </p>
          <div className="video-embed">
            <iframe src="https://www.youtube.com/embed/nJcBqNfo9qc" title="Cajun Koi Method" allowFullScreen></iframe>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudyTechniques;
