# Requirements Document

## Introduction

Flappy Kiro is a retro endless-scroller game that runs entirely in a web browser. The player controls a Superman-style character (blue body with a cape) that must fly through gaps between pairs of vertical building/pipe obstacles that continuously scroll from right to left. The player flaps to rise against gravity, and the game ends on collision with an obstacle, the ground, or the top boundary. The player earns points for each obstacle pair cleared, and the highest score persists across browser sessions.

The visual theme uses a light green background with white clouds decorating the background, green vertical obstacles arranged in top-and-bottom pairs, the character positioned toward the left side of the play area, and a score display at the bottom showing the current score and the high score (for example, "Score: 9 | High: 14").

## Glossary

- **Game**: The complete Flappy Kiro browser application, including rendering, input handling, physics, and scoring.
- **Player**: The human user interacting with the Game.
- **Character**: The blue Superman-style avatar with a cape that the Player controls.
- **Obstacle_Pair**: A top obstacle and a bottom obstacle sharing a horizontal position, separated by a vertical Gap through which the Character can pass.
- **Gap**: The open vertical space between the top and bottom obstacles of an Obstacle_Pair.
- **Play_Area**: The bounded rectangular region in which the Game is rendered and gameplay occurs.
- **Ground**: The lower boundary of the Play_Area.
- **Ceiling**: The upper boundary of the Play_Area.
- **Flap**: A single upward-impulse input action performed by the Player.
- **Gravity**: The constant downward acceleration applied to the Character while the Game is running.
- **Score**: The count of Obstacle_Pairs the Character has successfully passed in the current game session.
- **High_Score**: The greatest Score achieved across all sessions, persisted in browser storage.
- **Score_Display**: The on-screen text area showing the current Score and High_Score.
- **Game_State**: The current mode of the Game, one of: Ready, Running, or Game_Over.
- **Browser_Storage**: The persistent local storage mechanism provided by the browser (localStorage).

## Requirements

### Requirement 1: Game Rendering and Theme

**User Story:** As a Player, I want the game to render with a clear retro Flappy Bird style layout, so that I can recognize the play field and enjoy the visual theme.

#### Acceptance Criteria

1. THE Game SHALL render a Play_Area with a light green background.
2. THE Game SHALL render one or more white cloud shapes within the background of the Play_Area.
3. THE Game SHALL render the Character as a blue Superman-style avatar that includes a cape.
4. THE Game SHALL position the Character so that its horizontal center is within the leftmost 40 percent of the Play_Area width, measured from the left edge of the Play_Area.
5. THE Game SHALL render each Obstacle_Pair as a top obstacle and a bottom obstacle separated by a Gap.
6. THE Game SHALL render the Score_Display within the lower 15 percent of the Play_Area height, showing the current Score and the High_Score as two distinct labeled values.

### Requirement 2: Flap and Gravity Mechanic

**User Story:** As a Player, I want the character to rise when I flap and fall otherwise, so that I can control the character's altitude.

#### Acceptance Criteria

1. WHILE the Game_State is Running, THE Game SHALL apply a downward gravitational acceleration of 1200 px/s² to the Character.
2. WHILE the Game_State is Running, THE Game SHALL cap the Character's downward vertical velocity at a maximum of 700 px/s.
3. WHEN the Player performs a Flap AND the Game_State is Running, THE Game SHALL set the Character's vertical velocity to a fixed upward value of 400 px/s, replacing the Character's current vertical velocity.
4. WHEN the Player completes a mouse click, consisting of a button press and release, within the Play_Area AND the Game_State is Running, THE Game SHALL register exactly one Flap input.
5. WHEN the Player performs a touch tap within the Play_Area AND the Game_State is Running, THE Game SHALL register exactly one Flap input.
6. WHEN the Player presses the spacebar key AND the Game_State is Running, THE Game SHALL register exactly one Flap input.
7. IF a Flap input is received AND the Game_State is not Running, THEN THE Game SHALL ignore the Flap input and leave the Character's vertical velocity unchanged.

### Requirement 3: Endless Scrolling Obstacles

**User Story:** As a Player, I want obstacles to continuously scroll toward me with passable gaps, so that the game presents an ongoing challenge.

#### Acceptance Criteria

1. WHILE the Game_State is Running, THE Game SHALL move all Obstacle_Pairs horizontally from right to left at a constant speed between 100 and 300 pixels per second.
2. WHILE the Game_State is Running, THE Game SHALL generate new Obstacle_Pairs at the right edge of the Play_Area so that consecutive Obstacle_Pairs are spaced between 200 and 400 pixels apart horizontally.
3. THE Game SHALL assign each generated Obstacle_Pair a Gap whose vertical height is at least 1.5 times the Character height.
4. THE Game SHALL randomize the vertical center of the Gap of each generated Obstacle_Pair within 10% to 90% of the Play_Area height.
5. WHEN an Obstacle_Pair moves completely past the left edge of the Play_Area, THE Game SHALL remove that Obstacle_Pair from active rendering within 1 frame.

### Requirement 4: Collision Detection and Game Over

**User Story:** As a Player, I want the game to end when I hit an obstacle or boundary, so that the challenge has clear consequences.

#### Acceptance Criteria

1. IF the Character's bounding region overlaps the bounding region of any obstacle in an Obstacle_Pair by at least 1 pixel WHILE the Game_State is Running, THEN THE Game SHALL transition the Game_State to Game_Over within the same update cycle in which the overlap is detected.
2. IF the lower edge of the Character's bounding region contacts or crosses the upper boundary of the Ground WHILE the Game_State is Running, THEN THE Game SHALL transition the Game_State to Game_Over within the same update cycle in which the contact is detected.
3. IF the upper edge of the Character's bounding region contacts or crosses the lower boundary of the Ceiling WHILE the Game_State is Running, THEN THE Game SHALL transition the Game_State to Game_Over within the same update cycle in which the contact is detected.
4. WHEN the Game_State transitions to Game_Over, THE Game SHALL stop applying horizontal movement to all Obstacle_Pairs within the same update cycle as the transition.
5. WHEN the Game_State transitions to Game_Over, THE Game SHALL display a game over indication to the Player within the same update cycle as the transition.

### Requirement 5: Scoring

**User Story:** As a Player, I want to earn points for each obstacle I pass, so that I can measure my performance.

#### Acceptance Criteria

1. WHEN the Character's horizontal position passes the horizontal center of an Obstacle_Pair without collision, THE Game SHALL increase the Score by exactly one within 100 milliseconds.
2. WHEN the Game_State transitions to Ready, THE Game SHALL set the Score to the integer value zero.
3. WHILE the Game_State is Running, THE Game SHALL display the current Score in the Score_Display as a non-negative integer, updated within 100 milliseconds of any Score change.
4. THE Game SHALL count each Obstacle_Pair only once, such that a single Obstacle_Pair increases the Score by no more than one for the duration of a single game session.
5. IF the Character collides with an Obstacle_Pair before passing its horizontal center, THEN THE Game SHALL NOT increase the Score for that Obstacle_Pair.

### Requirement 6: High Score Persistence

**User Story:** As a Player, I want my best score to be remembered between sessions, so that I can try to beat my personal record.

#### Acceptance Criteria

1. WHEN the Game_State transitions to Game_Over AND the Score is greater than the High_Score, THE Game SHALL set the High_Score to the value of the Score.
2. WHEN the High_Score changes, THE Game SHALL write the integer value of the High_Score to Browser_Storage within 500 milliseconds of the change.
3. WHEN the Game loads, THE Game SHALL read the High_Score from Browser_Storage before the Score_Display is rendered.
4. IF no High_Score value exists in Browser_Storage WHEN the Game loads, THEN THE Game SHALL set the High_Score to zero.
5. IF the High_Score value read from Browser_Storage is missing, non-numeric, negative, or otherwise unparseable as a non-negative integer WHEN the Game loads, THEN THE Game SHALL set the High_Score to zero and continue loading without displaying an error to the Player.
6. THE Game SHALL display the High_Score in the Score_Display as a non-negative integer.
7. IF writing the High_Score to Browser_Storage fails WHEN the High_Score changes, THEN THE Game SHALL retain the current in-session High_Score value and continue gameplay without interrupting the Player.

### Requirement 7: Game State Lifecycle and Restart

**User Story:** As a Player, I want to start and restart the game easily, so that I can play multiple rounds without reloading the page.

#### Acceptance Criteria

1. WHEN the Game finishes loading, THE Game SHALL set the Game_State to Ready within 1 second and display a start instruction to the Player.
2. WHEN the Player performs a Flap AND the Game_State is Ready, THE Game SHALL transition the Game_State to Running within 100 milliseconds.
3. WHEN the Player performs a restart input AND the Game_State is Game_Over, THE Game SHALL reset the Score to zero, remove all active Obstacle_Pairs, reset the Character to its starting position, and set the Game_State to Ready, all within 500 milliseconds and without reloading the page.
4. WHILE the Game_State is Game_Over, THE Game SHALL display a restart instruction to the Player that remains visible until the Game_State transitions to Ready.
5. IF the Player performs a Flap OR a restart input WHILE the Game_State is Running, THEN THE Game SHALL ignore the input and preserve the current Game_State, Score, and Character position.
