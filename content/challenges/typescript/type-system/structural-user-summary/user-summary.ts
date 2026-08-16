type UserSummary = {
  id: string;
  name: string;
};

const apiUser = {
  id: "user-42",
  name: "Lia",
  role: "admin",
};

function renderSummary(user: UserSummary) {
  return `${user.id}: ${user.name}`;
}

renderSummary(apiUser);
