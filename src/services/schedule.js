export const SCHEDULE_STORAGE_KEY = "skwela_schedule";

const DAY_INDEX = {
  monday: 0,
  mon: 0,
  tuesday: 1,
  tue: 1,
  tues: 1,
  wednesday: 2,
  wed: 2,
  thursday: 3,
  thu: 3,
  thurs: 3,
  friday: 4,
  fri: 4,
  saturday: 5,
  sat: 5,
};
const COLORS = ["blue", "green", "purple", "yellow", "red"];
const START_MINUTES = 7 * 60;
const END_MINUTES = 17 * 60;

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      if (field) throw new Error("The CSV contains an unexpected quote.");
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The CSV has an unfinished quoted field.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function parseTime(value, rowNumber, columnName) {
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)?$/i);
  if (!match) {
    throw new Error(`Row ${rowNumber}: enter ${columnName} as a time such as 7:30 AM.`);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      throw new Error(`Row ${rowNumber}: ${columnName} has an invalid hour.`);
    }
    hours = (hours % 12) + (meridiem === "PM" ? 12 : 0);
  } else if (hours > 23) {
    throw new Error(`Row ${rowNumber}: ${columnName} has an invalid hour.`);
  }

  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes < START_MINUTES || totalMinutes > END_MINUTES) {
    throw new Error(`Row ${rowNumber}: class times must be between 7:00 AM and 5:00 PM.`);
  }

  return {
    value: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    minutes: totalMinutes,
  };
}

export function parseScheduleCsv(text) {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) {
    throw new Error("The CSV must include a header and at least one class.");
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const columns = {
    day: headers.indexOf("day"),
    course: headers.indexOf("course"),
    instructor: headers.indexOf("instructor"),
    room: headers.indexOf("room"),
    start: headers.indexOf("start"),
    end: headers.indexOf("end"),
  };
  const required = ["day", "course", "start", "end"];
  const missing = required.filter((name) => columns[name] === -1);
  if (missing.length) {
    throw new Error(`Missing CSV column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);
  }

  const classes = [];
  const importedAt = Date.now();
  rows.slice(1).forEach((values, index) => {
    const rowNumber = index + 2;
    const value = (column) => column === -1 ? "" : (values[column] || "").trim();
    const name = value(columns.course);
    if (!name) throw new Error(`Row ${rowNumber}: course name is required.`);

    const day = DAY_INDEX[value(columns.day).toLowerCase()];
    if (day === undefined) {
      throw new Error(`Row ${rowNumber}: day must be Monday through Saturday.`);
    }

    const start = parseTime(value(columns.start), rowNumber, "start");
    const end = parseTime(value(columns.end), rowNumber, "end");
    if (end.minutes <= start.minutes) {
      throw new Error(`Row ${rowNumber}: end time must be later than start time.`);
    }

    classes.push({
      id: importedAt + index,
      day,
      name,
      instructor: value(columns.instructor),
      room: value(columns.room),
      start: start.value,
      end: end.value,
      color: COLORS[index % COLORS.length],
    });
  });

  if (!classes.length) throw new Error("The CSV does not contain any classes.");
  return classes;
}
