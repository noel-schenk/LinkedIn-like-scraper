import * as puppeteer from "puppeteer";
import { BehaviorSubject } from "rxjs";

class Person {
  name: string;
  url: string;
  headline: string;
  image: string;
  type: string;
}

export class LinkedIn {
  private static instance: LinkedIn;
  private browser = puppeteer.launch({
    headless: false,
    args: [`--window-size=1920,1080`],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });
  private isLogin = new BehaviorSubject<boolean>(false);

  private constructor() {}

  public static getInstance(): LinkedIn {
    if (!LinkedIn.instance) {
      LinkedIn.instance = new LinkedIn();
      LinkedIn.instance.login();
    }

    return LinkedIn.instance;
  }

  private async getPage(): Promise<puppeteer.Page> {
    return (await (await this.browser).pages())[0];
  }

  private async login() {
    const usernameSelector = '[id="username"]';
    const passwordSelector = '[id="password"]';
    const submitSelector = '[type="submit"]';
    const profileImageSelector = ".feed-identity-module__member-photo";

    const loginUrl =
      "https://www.linkedin.com/login/de?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin";

    const username = "addyourusername";
    const password = "addyourpassword";

    throw "add username and password";

    const page = await this.getPage();
    await page.goto(loginUrl);
    await page.waitForSelector(usernameSelector);
    await page.waitForSelector(passwordSelector);

    await page.focus(usernameSelector);
    await page.keyboard.type(username);

    await page.focus(passwordSelector);
    await page.keyboard.type(password);

    await page.click(submitSelector);

    await page.waitForSelector(profileImageSelector);

    this.isLogin.next(true);
  }

  private afterLogin(cb: Function) {
    this.isLogin.subscribe((isLogin) => {
      if (isLogin) {
        cb();
      }
    });
  }

  async unload() {
    (await this.browser).close();
  }

  async getLikesFromPost(postUrl: string) {
    return new Promise<Person[]>((resolve) => {
      this.afterLogin(async () => {
        const likeCounterSelector =
          ".social-details-social-counts__reactions-count";
        const likeScrollListSelector =
          ".artdeco-modal__content.social-details-reactors-modal__content";

        const page = await this.getPage();
        await page.goto(postUrl);
        await page.waitForSelector(likeCounterSelector);

        await page.click(likeCounterSelector);

        const peopleWhoLikedPost: Person[] = (await page.evaluate(
          async (likeScrollListSelector) => {
            return new Promise(async (resolve) => {
              // scroll element all the way down
              let scrollTop = -1;
              const likeScrollListElement = document.querySelector(
                likeScrollListSelector
              );
              await new Promise<void>((resolve) => {
                const interval = setInterval(async () => {
                  for (let step = 0; step < 10; step++) {
                    setTimeout(
                      () => likeScrollListElement.scrollBy(0, 1000),
                      100 * step
                    );
                  }
                  setTimeout(() => {
                    if (likeScrollListElement.scrollTop !== scrollTop) {
                      scrollTop = likeScrollListElement.scrollTop;
                    } else {
                      clearInterval(interval);
                      resolve();
                    }
                  }, 1800);
                }, 2000);
              });

              // return all likes as array
              class Person {
                name: string;
                url: string;
                headline: string;
                image: string;
                reactionType: string;
              }
              const people = new Array<Person>();
              [
                ...(document.querySelector(".artdeco-list").children as any),
              ].map((personWhichLikedPost) => {
                const person = new Person();
                person.name = personWhichLikedPost.querySelector(
                  ".artdeco-entity-lockup__title span"
                ).innerText;
                person.url = personWhichLikedPost
                  .querySelector("a")
                  .getAttribute("href")
                  .split("?")[0];
                person.headline = personWhichLikedPost.querySelector(
                  ".artdeco-entity-lockup__caption"
                ).innerText;
                person.image = personWhichLikedPost
                  .querySelector(".ivm-view-attr__img-wrapper img")
                  ?.getAttribute("src");
                person.reactionType = personWhichLikedPost
                  .querySelector(".reactions-icon")
                  ?.getAttribute("alt");
                people.push(person);
              });
              resolve(people);
            });
          },
          likeScrollListSelector
        )) as any;

        resolve(peopleWhoLikedPost);
      });
    });
  }
}
