import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import readline from 'readline';

const path = "./data.json";

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const makeCommitWithDate = async (dateString, message) => {
  const data = {
    date: dateString,
  };
  console.log(`Attempting to commit: "${message}" on ${dateString}`);

  try {
    await jsonfile.writeFile(path, data);
    await simpleGit().add([path]).commit(message, { '--date': dateString });
    console.log(`Successfully committed: "${message}" on ${dateString}`);
  } catch (err) {
    console.error(`Error processing commit "${message}" on ${dateString}:`, err);
  }
};

const generateHistory = async () => {
  const git = simpleGit();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

  console.log("\n--- Git History Generation Options ---");

  // Get the target year for random commits
  let targetYear;
  while (true) {
    const yearInput = await askQuestion("Enter the target year for random commits (e.g., 2024): ");
    targetYear = parseInt(yearInput.trim(), 10);
    const currentYear = moment().year();

    if (isNaN(targetYear) || targetYear < 2008 || targetYear > currentYear) { // GitHub started in 2008
      console.warn(`Invalid year entered. Please enter a year between 2008 and ${currentYear}.`);
    } else {
      break;
    }
  }

  // Get the commit density level
  let commitLevel;
  while (true) {
    const levelInput = await askQuestion("Choose commit density level (low, medium, high): ").then(input => input.toLowerCase());
    if (['low', 'medium', 'high'].includes(levelInput)) {
      commitLevel = levelInput;
      break;
    } else {
      console.warn("Invalid level. Please choose 'low', 'medium', or 'high'.");
    }
  }

  // Get days to skip
  const skipDaysInput = await askQuestion("Enter days of the week to skip (0=Sun, 1=Mon,..., 6=Sat, comma-separated, e.g., '0,6' for weekends, or leave empty for no skips): ");
  const skippedDays = skipDaysInput.split(',').map(day => parseInt(day.trim(), 10)).filter(day => !isNaN(day) && day >= 0 && day <= 6);

  rl.close();

  console.log(`\n--- Generating "${commitLevel}" random commits for ${targetYear} ---`);

  const startDate = moment(`${targetYear}-01-01T00:00:00`);
  const endDate = moment(`${targetYear}-12-31T23:59:59`); // End of the target year

  let currentDate = startDate.clone();
  const commitMessage = "Random activity"; // Generic commit message

  while (currentDate.isSameOrBefore(endDate, 'day')) {
    const dayOfWeek = currentDate.day();

    // Check if this day should be skipped
    if (skippedDays.includes(dayOfWeek)) {
      console.log(`Skipping commits for ${currentDate.format('YYYY-MM-DD')} (Day of week: ${dayOfWeek})`);
      currentDate.add(1, 'day');
      continue;
    }

    let numberOfCommitsToday = 0;

    switch (commitLevel) {
      case 'low':
        numberOfCommitsToday = getRandomInt(0, 2); // 0-2 commits per day
        break;
      case 'medium':
        numberOfCommitsToday = getRandomInt(1, 5); // 1-5 commits per day
        break;
      case 'high':
        numberOfCommitsToday = getRandomInt(3, 10); // 3-10 commits per day
        break;
      default:
        numberOfCommitsToday = 1; // Fallback
    }

    for (let i = 0; i < numberOfCommitsToday; i++) {
      const commitTime = currentDate.clone()
                                   .hour(getRandomInt(0, 23))
                                   .minute(getRandomInt(0, 59))
                                   .second(getRandomInt(0, 59))
                                   .format();
      await makeCommitWithDate(commitTime, commitMessage);
    }
    currentDate.add(1, 'day');
  }
  console.log(`Finished generating "${commitLevel}" random commits for ${targetYear}.`);

  console.log("Pushing all generated commits to remote...");
  await new Promise(resolve => git.push((err) => {
    if (err) console.error("Error pushing commits:", err);
    else console.log("All commits pushed successfully.");
    resolve();
  }));

  console.log("\n--- Git history generation process complete ---");
};

generateHistory().catch(console.error);