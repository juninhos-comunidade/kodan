function readField<T, K extends string>(record: T, key: K) {
  return record[key];
}

const deploy = {
  id: "deploy-18",
  status: "running",
  attempts: 2,
};

const status = readField(deploy, "status");
