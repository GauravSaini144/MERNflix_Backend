import {Router} from "express"

const router = Router();

router.route("/").get((req, res)=>{
    return res.status(200).json({status:"ok"});
});
export default router;