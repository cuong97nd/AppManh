const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const puppeteer = require("puppeteer");
const fs = require("fs");

let cookies = "";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"), // use a preload script
    },
    resizable: false,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

//main listener

ipcMain.on("islogined", (event, arg) => {
  event.returnValue = {
    message: cookies === "" ? false : true,
  };
});

ipcMain.on("start", async (event, arg) => {
  try {
    //luu anh
    let buffer = new Buffer.from(
      arg.value.img.replace(/^(data:image\/(jpg|jpeg|png);base64,)/g, ""),
      "base64"
    );
    //todo luu anh trong array

    fs.writeFile("img.png", buffer, {}, () => {
      console.log("dowloaded");
      arg.value.img = "img.png";
    });

    arg.value.add.map((elm, i) => {
      if (elm.img) {
        let buffer = new Buffer.from(
          elm.img.replace(/^(data:image\/(jpg|jpeg|png);base64,)/g, ""),
          "base64"
        );

        fs.writeFile("i" + i + ".png", buffer, {}, () => {
          console.log("dowloaded img" + i);
          arg.value.add[i].img = "i" + i + ".png";
        });
      }
      if (elm.thumb) {
        let buffer1 = new Buffer.from(
          elm.thumb.replace(/^(data:image\/(jpg|jpeg|png);base64,)/g, ""),
          "base64"
        );

        fs.writeFile("t" + i + ".png", buffer1, {}, () => {
          console.log("dowloaded thumb" + i);
          arg.value.add[i].thumb = "t" + i + ".png";
        });
      }
    });

    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 900 },
    });
    let page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.goto("https://sellercentral.amazon.com/inventory/");
    let pageNum = { now: 0, all: 1 };
    //doi 5 giay
    await page.waitForTimeout(arg.t1);

    while (pageNum.now <= pageNum.all) {
      let products = await page.evaluate(() => {
        a = Array.from(
          document.getElementById("head-row").parentElement.children
        );
        return a.map((x) => ({
          id: x.id,
          sku: x.children[5].innerText,
          asin: x.children[7].children[0].children[1].innerText,
        }));
      });

      console.log(products);

      pageNum = await page.evaluate(() => {
        now = document.getElementById("myitable-gotopage");
        all = now.nextElementSibling.innerText.match(/\d+/)[0];
        return { now: Number(now.value), all: Number(all) };
      });

      //check item
      products = products.filter((product) =>
        arg.rows.find(
          (row) => row.Asin === product.asin && row.Sku === product.sku
        )
      );
      console.log(products);

      //chay tung trang
      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        //lay pageProduct
        productPage = await browser.newPage();

        try {
          await productPage.goto(
            "https://sellercentral.amazon.com/gestalt/managecustomization/index.html?sku=" +
              product.sku
          );
          await page.waitForTimeout(arg.t1);

          //nhap thong tin
          a = await productPage.$("#katal-id-1");
          for (let i = 0; i < 10; i++) {
            await a.press("Backspace");
          }

          await a.type(arg.value.label1);
          await productPage.waitForTimeout(arg.t3);

          a = await productPage.$("#katal-id-2");
          for (let i = 0; i < 10; i++) {
            await a.press("Backspace");
          }

          if (arg.value.instuctions1 == undefined) {
            arg.value.instuctions1 = "";
          }

          await a.type(arg.value.instuctions1);
          await productPage.waitForTimeout(arg.t3);

          //chon dropdownmenu
          a = a = await productPage.$(
            "div.building-block-content div.building-block-content div.building-block-content div.building-block-content"
          );
          if (a == null) {
            a = await productPage.$(
              "#root > div > div:nth-child(2) > div.one-by-one-content > div.gestalt-building-block.gestalt-building-block-container-picker.gestalt-Surfaces > div.building-block-content > div:nth-child(2) > div.children-list__2_5Dx > div.child-container__LXV6B > div > div:nth-child(2) > div > div > div.building-block-content > div > div.preview-container-children > div > div > div.building-block-content > div:nth-child(2) > div.add-new-pane-border__22oin > div > kat-button > button"
            );
            await a.click();
            a = await productPage.$$("kat-box kat-box");
            await productPage.waitForTimeout(arg.t3);
            await a[2].click();
            await productPage.waitForTimeout(arg.t3);

            a = await productPage.$("kat-modal-footer button");
            await a.click();

            await productPage.waitForTimeout(arg.t3);
          }
          !arg.value.isRequired &&
            (await (await productPage.$("kat-checkbox")).click());
          await productPage.waitForTimeout(arg.t3);

          //up anh img
          a = await productPage.$("input.hidden");
          await a.uploadFile("img.png");
          await productPage.waitForTimeout(arg.t3);

          //dien thong tin vao array
          let ok = [];
          ok.push(arg.value.label2);
          ok.push(arg.value.instuctions2);
          arg.value.add.map((elm, i) => {
            ok.push(elm.name);
            ok.push(elm.price);
          });

          ok.forEach((x, i) => {
            if (x == undefined) {
              ok[i] = "";
            }
          });

          let as = await productPage.$$(
            "div.building-block-content div.building-block-content div.building-block-content div.building-block-content kat-input input"
          );
          as = as.reverse();

          // an nut cho du
          let ic = await productPage.$$("span kat-icon");
          //neu so dong du kien it hon
          for (let i = 0; i < ok.length - as.length; i = i + 2) {
            await ic[1].click();
            await productPage.waitForTimeout(arg.t3);
          }

          // neu so dong du kien nhieu hon
          for (let i = 0; i < as.length - ok.length; i = i + 2) {
            await ic[i + 2].click();
            await productPage.waitForTimeout(arg.t3);
          }

          as = await productPage.$$(
            "div.building-block-content div.building-block-content div.building-block-content div.building-block-content kat-input input"
          );
          as = as.reverse();

          for (let i = 0; i < as.length; i++) {
            const elm = as[i];
            for (let i = 0; i < 20; i++) {
              await elm.press("Backspace");
            }
            await elm.type(ok.pop());
            await productPage.waitForTimeout(arg.t3);
          }

          //dien file vao array
          ok = [];
          arg.value.add.map((elm, i) => {
            ok.push(elm.thumb);
            ok.push(elm.img);
          });
          ok = ok.reverse();

          as = await productPage.$$(
            "div.building-block-content div.building-block-content div.building-block-content div.building-block-content .drop-child-container input"
          );

          for (let i = 0; i < as.length; i++) {
            const elm = as[i];
            if (ok[as.length - i - 1] == undefined) {
              ok.pop();
            } else {
              await elm.uploadFile(ok.pop());
              await productPage.waitForTimeout(arg.t2);
            }
          }
          await productPage.waitForTimeout(arg.t3);
          await productPage.waitForTimeout(arg.t3);

          //an save
          a = await productPage.$("kat-button.save-button");
          await a.click();
          await productPage.waitForTimeout(arg.t1);
          await productPage.waitForTimeout(arg.t1);

          a = await productPage.url();
          if (
            a ===
            "https://sellercentral.amazon.com/customization/manageListings"
          ) {
            //thanh cong
            event.reply("rep", { message: product, status: "true" });
            console.log("true");
          } else {
            //that bai
            event.reply("rep", { message: product, status: "false" });
            console.log("false");
          }
          await productPage.close();
        } catch (error) {
          await productPage.close();
          event.reply("rep", { message: product, status: "false" });
        }
      }

      if (pageNum.now < pageNum.all) {
        //todo di toi page+1
        a = await page.$$("#myitable-pagination > ul li");
        await a[a.length - 1].click();
        await page.waitForTimeout(arg.t1);
      } else {
        pageNum.now++;
        event.reply("rep", { message: "Đã hoàn thành", status: "finish" });
      }
    }
  } catch (error) {
    event.reply("rep", { message: null, status: "error" });
  }
});

ipcMain.on("login", async (event, arg) => {
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1600, height: 900 },
    });
  } catch (error) {}
  let page = await browser.newPage();
  await page.goto("https://sellercentral.amazon.com/signin");
  page.on("load", async () => {
    cookies = await page.cookies();
    console.log(cookies);
  });
  browser.on("disconnected", () => {
    event.returnValue = {
      message: cookies === "" ? false : true,
    };
  });
});
