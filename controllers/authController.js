const fs = require("fs");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");

const generateAccessToken = (id, roles) => {
	const payload = { id, roles };

	return jwt.sign(payload, rocess.env.SECRET, { expiresIn: "24h" });
};

class AuthController {
	async registration(req, res) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.json({ message: "Помилка під час реєстрації", errors });
			}

			const { login, password } = req.body;
			const candidate = await User.findOne({ login });
			if (candidate) {
				return res.json({
					messages: { login: "Такий користувач вже існує" },
				});
			}

			const hashPassword = bcrypt.hashSync(password, 7);
			const userRole = await Role.findOne({ value: "USER" });
			const user = new User({
				login,
				password: hashPassword,
				roles: [userRole.value],
			});
			await user.save();

			return res.status(200).json({ message: "Користувач успішно зареєстрований" });
		} catch (e) {
			console.log(e);
			res.json({ errorMessage: "Помилка реєстрації" });
		}
	}

	async login(req, res) {
		try {
			const { login, password } = req.body;

			const user = await User.findOne({ login });

			if (!user) {
				return res.json({ messages: { login: "Користувач не знайдений" } });
			}

			const validPassword = bcrypt.compareSync(password, user.password);

			if (!validPassword) {
				return res.json({
					messages: { password: "Введено неправильний пароль" },
				});
			}

			const token = generateAccessToken(user._id, user.roles);
			return res.json({ token, roles: user.roles, username: user.login });
		} catch (e) {
			console.log(e);
			res.json({ errorMessage: "Помилка входу" });
		}
	}

	async removeUser(req, res) {
		try {
			await User.findOneAndDelete({
				login: req.body.login,
			});

			return res.status(200).json({ message: "Користувача успішно видалено" });
		} catch (e) {
			console.log(e);
		}
	}

	async getUsers(req, res) {
		const users = await User.find();

		return res.json({ users });
	}

	getRoles(req, res) {
		const token = req.headers.authorization.split(" ")[1];

		const { roles } = jwt.verify(token, rocess.env.SECRET);

		return res.json({ roles });
	}

	getLogs(req, res) {
		const filenames = fs.readdirSync("./logs");

		const newFilename =
			"logs_" +
			new Date()
				.toLocaleString()
				.replace(", ", "_")
				.replace(/\./g, "_")
				.replace(/\:/g, "_") +
			".txt";

		fs.rename("./logs/" + filenames[0], "./logs/" + newFilename, () => {
			return res.status(200).json({ filename: newFilename})
		});
	}
}

module.exports = new AuthController();