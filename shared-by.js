/**
 * Resource Contributors & Leaderboard Data (SASTC Portal)
 *
 * How automatic ranking works:
 * 1. Add each contributor's `name` and `dp` (Display Picture URL) below.
 * 2. Position (1st, 2nd, 3rd, and list order) is calculated AUTOMATICALLY based on how many
 *    resources each person has uploaded:
 *    - Either set `sharedBy: "Contributor Name"` inside `cse-resource.js`, `ag-resource.js`, or `bba-resource.js`
 *    - Or set/update the `uploads` count number directly in this file.
 */

export const sharedByData = [
  {
    name: "Mehedi Al Hasan Sawon",
    dp: "https://i.ibb.co.com/7JnHCrB5/Chat-GPT-Image-Jul-29-2026-09-55-12-PM.png",
    dept: "CSE",
    uploads: 24
  },
  {
    name: "SASTC CSE Archive",
    dp: "",
    dept: "CSE",
    uploads: 18
  },
  {
    name: "SASTC Agriculture Archive",
    dp: "",
    dept: "AG",
    uploads: 15
  },
  {
    name: "SASTC BBA Archive",
    dp: "",
    dept: "BBA",
    uploads: 12
  },
  {
    name: "Academic Resource Team",
    dp: "",
    dept: "SASTC",
    uploads: 9
  },
  {
    name: "Student Contributors",
    dp: "",
    dept: "ALL",
    uploads: 6
  }
];

export default sharedByData;
