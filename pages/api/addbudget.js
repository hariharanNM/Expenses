import dbConnect from "../../db/connectDb";
import Transactions from "../../models/Transactions";
import { verify } from "jsonwebtoken";
import User from "../../models/User";

dbConnect();

const secret = "expenses";

export default async function handler(req, res) {
  const { method } = req;

  if (method === "POST") {
    try {
      const jwt = req.cookies.token;

      if (!jwt) {
        res.status(403).json({ message: "un authorized" });
      }

      const dataFromToken = verify(jwt, secret);

      const currentUser = await User.findOne({ email: dataFromToken.email });

      let { Category, Expense, PaidBy, Description, Participants } = req.body;

      const paidByUser = await User.findById(PaidBy);

      var partipateData = [];

      var partipatesId = [];

      for (let id of Participants) {
        partipatesId.push(id.id);
      }

      const partipates = await User.find().where("_id").in(partipatesId).exec();

      for (let par of partipates) {
        partipateData.push({ id: par._id, name: par.username });
      }

      const transaction = await new Transactions({
        Category,
        Expense,
        PaidBy: {
          id: paidByUser._id,
          name: paidByUser.username,
        },
        Description,
        Participants: partipateData,
        entryBy: currentUser.username,
      });

      await transaction.save();

      for (let f of Participants) {
        await User.update(
          { _id: f.id },
          { $push: { transactions: transaction } }
        );
      }

      let splitPerPerson = Expense / Participants.length;

      let paidByUserFrnds = paidByUser.Friends;

      for (let frnd = 0; frnd < paidByUserFrnds.length; frnd++) {
        for (let id of Participants) {
          if (id.id === paidByUserFrnds[+frnd].id) {
            let user = await User.findById(paidByUserFrnds[+frnd].id);

            let userFrnds = user.Friends;

            paidByUserFrnds[+frnd].himOwn =
              paidByUserFrnds[+frnd].himOwn + splitPerPerson;

            for (let frnds in userFrnds) {
              if (userFrnds[+frnds].id === paidByUser._id.toString()) {
                userFrnds[+frnds].youOwn =
                  userFrnds[+frnds].youOwn + splitPerPerson;

                await User.findOneAndUpdate(
                  { _id: id.id },
                  { Friends: userFrnds },
                  {
                    new: true,
                  }
                );
              }
            }

            await User.findOneAndUpdate(
              { _id: PaidBy },
              { Friends: paidByUserFrnds },
              {
                new: true,
              }
            );
          }
        }
      }

      return res.status(200).json({ message: "ok!" });
    } catch (e) {
      return res.status(401).json({ message: "no user" });
    }
  }
}
