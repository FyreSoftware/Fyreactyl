export interface IConfig {
  database: string;
}
const Config: IConfig = {
  database: process.env.database as string,
};

export default Config;
