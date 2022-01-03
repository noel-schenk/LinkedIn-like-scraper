import { LinkedIn } from "./LinkedIn";

const linkedIn = LinkedIn.getInstance();
linkedIn
  .getLikesFromPost(
    "https://www.linkedin.com/posts/wiebke-guelcibuk_das-ist-keine-diktatur-activity-6878955409965629440-GIrq"
  )
  .then((people) => {
    console.log(people);
  });
