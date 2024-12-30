import fs from 'node:fs'
import { sleep } from '@/utils'

const puppeteer = require('puppeteer')
export default class GetBilibiliSearchResultService {
  async run (keyword:string) {
    // const postUrls:Array<string>|[] =[] as []
    const result:Array<any> = []
    const csvSResult:Array<any> = []
    const xyzHostUrl = 'https://www.xyz.cn'

    try {
      // Launch the browser and open a new blank page
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      const page = await browser.newPage()
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
      // Navigate the page to a URL

      await page.goto(`https://search.bilibili.com/all?keyword=${keyword}&from_source=webtop_search`)
      // 等待页面加载一秒
      await sleep(1000)
      const videosSelectors = await page.$$('.bili-video-card')
      for (const videoSelector of videosSelectors) {
        const urlSelector = await videoSelector.$('a')
        // @ts-ignore
        const url = await urlSelector?.evaluate(el => el.getAttribute('href'))
        console.log('url', url)
        result.push(url)
      }
      await browser.close()
      return result
    } catch (e) {
      console.log(e)
    } finally {
      // fs.writeFileSync(`mdFile/result.json`,JSON.stringify(result))
    }
  }
}
