/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { algora, type AlgoraOutput } from "@algora/sdk";
import Link from "next/link";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

// import { invoke } from "@tauri-apps/api/tauri";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/api/notification";

type RemoteData<T> =
  | { _tag: "loading" }
  | { _tag: "failure"; error: Error }
  | { _tag: "success"; data: T };

type Bounty = AlgoraOutput["bounty"]["listWithClaims"]["items"][number];

export default function Home() {
  const [page, setPage] = useState("bounties");

  // const [zaf, setZaf] = useState("fail");
  // const [kreme, setKreme] = useState("fail");
  // useEffect(() => {
  //   invoke<string>("greet", { name: "zaf" })
  //     .then((m) => setZaf(m))
  //     .catch(console.error);
  //   invoke<string>("greet", { name: "kreme" })
  //     .then((m) => setKreme(m))
  //     .catch(console.error);
  // }, []);

  const [permission, setPermission] = useState<boolean>(false);
  const [lastBountyId, setLastBountyId] = useState<string>();
  const [bounties, setBounties] = useState<RemoteData<Bounty[]>>({
    _tag: "loading",
  });
  const [awards, setAwards] = useState<RemoteData<Bounty[]>>({
    _tag: "loading",
  });

  const notification = async () => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }
    if (permissionGranted) {
      setPermission(true);
    }
  };

  useEffect(() => {
    const ac = new AbortController();

    notification();

    algora.bounty.listWithClaims
      .query({ limit: 8 }, { signal: ac.signal })
      .then(({ items: data }) =>
        data.filter((b) => b.type === "standard" && b.status === "active")
      )
      .then((data) =>
        data.sort((a, b) => {
          return b.created_at.getTime() - a.created_at.getTime();
        })
      )
      .then((data) => data.slice(0, 4))
      .then((data) => {
        setBounties({ _tag: "success", data }), setLastBountyId(data[0].id);
      })
      .catch((error) => setBounties({ _tag: "failure", error }));

    algora.bounty.listWithClaims
      .query({ limit: 4, status: "completed" }, { signal: ac.signal })
      .then(({ items: data }) =>
        data.sort((a, b) => {
          return b.created_at.getTime() - a.created_at.getTime();
        })
      )
      .then((data) => setAwards({ _tag: "success", data }))
      .catch((error) => setAwards({ _tag: "failure", error }));

    return () => ac.abort();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const ac = new AbortController();

      algora.bounty.listWithClaims
        .query({ limit: 8 }, { signal: ac.signal })
        .then(({ items: data }) =>
          data.filter((b) => b.type === "standard" && b.status === "active")
        )
        .then((data) =>
          data.sort((a, b) => {
            return b.created_at.getTime() - a.created_at.getTime();
          })
        )
        .then((data) => data.slice(0, 4))
        .then((data) => setBounties({ _tag: "success", data }))
        .catch((error) => setBounties({ _tag: "failure", error }));

      return () => ac.abort();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      permission &&
      bounties._tag === "success" &&
      bounties.data[0].id !== lastBountyId
    ) {
      const lastData = bounties.data[0];
      const orgName = lastData.org.name;
      const amount = lastData.reward_formatted;
      console.log("new notification"); // dev mode notifications are not working on macos
      sendNotification(`${orgName} shared a ${amount} bounty`);
      setLastBountyId(lastData.id);
    }
  }, [bounties]);

  const awardsPage = () => {
    algora.bounty.listWithClaims
      .query({ limit: 4, status: "completed" })
      .then(({ items: data }) =>
        data.sort((a, b) => {
          return b.created_at.getTime() - a.created_at.getTime();
        })
      )
      .then((data) => setAwards({ _tag: "success", data }))
      .catch((error) => setAwards({ _tag: "failure", error }));

    return setPage("awards");
  };

  return (
    <main className="h-[368px] flex flex-col rounded-2xl bg-[#040217] items-center pt-2 px-2">
      <div className="flex p-3">
        <svg
          aria-hidden="true"
          viewBox="0 0 231.69101 66.82036"
          className="inline-block h-10 w-auto fill-white"
        >
          <g transform="translate(-13.600026,-120.24454)">
            <path d="m 116.984,138.78637 v 30.53821 h -5.22816 v -3.76238 a 15.27175,15.27175 0 1 1 0,-23.01875 v -3.76766 z m -5.21493,15.30085 a 10.025062,10.025062 0 1 0 -10.02771,10.02507 10.033,10.033 0 0 0 10.01448,-10.02507 z"></path>
            <path d="m 121.78619,128.97033 h 5.21494 v 40.35425 h -5.21494 z"></path>
            <path d="m 161.94465,178.88927 v 0.11641 a 8.6862707,8.6862707 0 0 1 -1.10067,3.99786 7.4903541,7.4903541 0 0 1 -2.20133,2.43416 c -1.16152,0.86784 -2.83898,1.56369 -5.15938,1.62719 h -13.15243 c -3.13002,0 -5.10117,-1.28058 -6.14627,-2.38125 -2.48973,-2.61144 -2.43152,-6.26269 -2.43152,-6.66221 l 5.21758,0.16934 c -0.0609,0.52916 0.11642,2.0267 0.98425,2.91041 0.52917,0.52917 1.27529,0.75406 2.38125,0.75406 h 13.16037 c 2.667,-0.0556 3.19088,-1.74095 3.24644,-2.78077 -0.17198,-2.25954 -2.14312,-2.72256 -3.24644,-2.78341 h -12.98045 c -6.43203,0 -8.74978,-5.21494 -8.74978,-8.74977 0,-0.2884 0,-3.30465 1.9685,-5.73617 a 15.08125,15.08125 0 0 1 -2.08491,-7.70731 15.306146,15.306146 0 0 1 23.75958,-12.7 c 1.79652,-1.85209 4.40531,-2.60615 6.42938,-2.60615 v 5.21494 c -0.635,0 -1.9103,0.17462 -2.71992,0.9869 l 0.0582,0.0556 a 15.369646,15.369646 0 0 1 2.9554,9.04346 15.496646,15.496646 0 0 1 -8.636,13.79537 15.824729,15.824729 0 0 1 -6.61459,1.44198 15.507229,15.507229 0 0 1 -9.6176,-3.35492 4.6672499,4.6672499 0 0 0 -0.29104,1.50284 c 0,1.10331 0.40216,3.59304 3.53218,3.59304 h 12.99104 a 8.9614374,8.9614374 0 0 1 5.15938,1.6801 8.6545207,8.6545207 0 0 1 3.28877,6.13834 z m -25.09044,-24.80205 a 10.146771,10.146771 0 0 0 1.32292,4.98475 9.3053957,9.3053957 0 0 0 2.26219,2.72257 10.038292,10.038292 0 0 0 6.43202,2.31775 9.9377499,9.9377499 0 0 0 10.02506,-10.02507 10.146771,10.146771 0 0 0 -10.02506,-10.0277 10.054167,10.054167 0 0 0 -10.01713,10.0277 z"></path>
            <path d="m 195.15515,154.08722 a 15.269104,15.269104 0 1 1 -15.24265,-15.30085 15.255875,15.255875 0 0 1 15.24265,15.30085 z m -15.24265,-10.0277 a 10.027708,10.027708 0 1 0 10.02771,10.0277 10.067396,10.067396 0 0 0 -10.02771,-10.0277 z"></path>
            <path d="m 213.90088,146.8985 h -5.21759 c 0,-0.92605 -0.23547,-1.68011 -0.63764,-2.08492 -0.63765,-0.63765 -1.68011,-0.75406 -2.02671,-0.75406 -1.10067,0.0609 -2.91042,0.40745 -3.13002,2.49237 v 22.77269 h -5.207 v -30.53821 h 5.21758 v 0.63765 a 8.4851874,8.4851874 0 0 1 3.01361,-0.5768 c 0.57679,0 3.53218,0.0582 5.73616,2.14048 1.03188,1.04246 2.25161,2.84163 2.25161,5.9108 z"></path>
            <path d="m 245.29104,138.78637 v 30.53821 h -5.21758 v -3.76238 a 15.27175,15.27175 0 1 1 0,-23.01875 v -3.76766 z m -5.21758,15.30085 a 10.025062,10.025062 0 1 0 -10.02242,10.02507 10.027708,10.027708 0 0 0 10.02242,-10.02507 z"></path>
            <path d="M 43.837295,172.90174 A 20.767146,20.767146 0 1 0 23.070152,152.1346 20.790958,20.790958 0 0 0 43.837295,172.90174 Z M 28.226878,152.10285 a 18.888604,18.888604 0 0 1 -0.923395,5.96106 14.036146,14.036146 0 0 1 -0.722313,1.778 c -2.203978,-4.36562 -2.209268,-10.81352 0,-15.38023 1.103313,2.20398 1.656292,4.91332 1.656292,7.64117 z m 11.927417,-18.56317 a 9.3080415,9.3080415 0 0 1 1.748896,-0.18521 h 0.02381 c -2.193396,3.62744 -9.151937,7.78669 -13.250333,7.78669 h -0.238125 c 1.762125,-3.16971 7.416271,-6.75481 11.726333,-7.60148 z M 59.106399,141.12 c -4.497917,-0.12965 -11.228917,-4.04548 -13.390563,-7.71525 a 14.343062,14.343062 0 0 1 1.897063,0.23547 c 4.458229,0.84667 9.006416,3.75444 11.504083,7.47978 z M 46.96467,157.57179 c 3.148541,2.59291 3.749146,2.93423 7.802562,4.49791 a 21.814896,21.814896 0 0 0 -7.707312,4.36298 21.743458,21.743458 0 0 0 -0.08467,-8.86089 z m -1.27,13.40379 c 2.434166,-3.88409 9.083146,-7.78934 13.467291,-7.78934 h 0.01852 c -2.423583,3.88673 -9.054041,7.78934 -13.435541,7.78934 z m 13.136562,-9.9404 c -3.950229,0 -10.877021,-4.20158 -13.123333,-7.79727 5.654146,0.68263 10.075333,3.2385 13.467291,7.78404 -0.111125,0 -0.227541,0.005 -0.343958,0.005 z m -1.378479,-4.78896 a 30.734,30.734 0 0 0 -3.249083,-2.26483 29.426958,29.426958 0 0 0 -3.548063,-1.65364 l -0.455083,-0.19315 a 21.235458,21.235458 0 0 0 7.617354,-4.34181 21.566187,21.566187 0 0 0 0.04233,8.763 z m -2.820458,-14.05466 c -0.166688,0.0688 -0.330729,0.14287 -0.494771,0.20902 a 31.00652,31.00652 0 0 0 -3.542771,1.67217 30.014333,30.014333 0 0 0 -3.175,2.21985 c -0.137583,0.10054 -0.264583,0.20637 -0.407458,0.30956 a 21.859875,21.859875 0 0 0 0.04233,-8.74448 21.764625,21.764625 0 0 0 7.582958,4.33388 z m 4.553479,1.11389 c -1.656292,3.38402 -8.765646,7.50359 -13.49375,7.77082 2.405062,-3.8788 8.871479,-7.64117 13.499041,-7.77082 z m -17.245542,27.67013 h -0.116416 c -4.233334,0 -10.977563,-4.00315 -13.340292,-7.77081 5.643563,0.67204 10.059458,3.21997 13.456708,7.77081 z m -4.429125,-18.81717 a 21.380979,21.380979 0 0 0 -7.699375,4.36827 21.960416,21.960416 0 0 0 0,-8.73125 21.354521,21.354521 0 0 0 7.699375,4.3524 z m 3.053292,-5.61975 a 22.084771,22.084771 0 0 0 -7.482417,-4.318 22.820312,22.820312 0 0 0 7.495646,-4.34975 22.328187,22.328187 0 0 0 -0.01323,8.65717 z m -5.413375,8.78152 c 0.325438,-0.16668 0.653521,-0.32808 0.98425,-0.48154 a 20.584583,20.584583 0 0 1 1.992313,-0.79375 14.120812,14.120812 0 0 1 3.817937,-0.79375 14.091708,14.091708 0 0 1 -3.264958,3.48986 c -3.040063,2.40506 -7.172854,4.27302 -10.218208,4.28889 1.140354,-2.07169 3.767666,-4.20423 6.688666,-5.72029 z m 5.495396,11.27125 c -3.439583,-2.86544 -4.868333,-3.46339 -7.728479,-4.47675 a 21.534437,21.534437 0 0 0 7.65175,-4.34181 21.846646,21.846646 0 0 0 0.07673,8.80798 z m 3.151187,3.24909 c -2.20927,-5.20965 -2.20927,-10.27907 0,-15.45961 2.256896,4.37356 2.262188,10.83204 0,15.44902 z m 0.04498,-35.35363 c 2.209271,5.20436 2.209271,10.27906 0,15.46225 -2.251604,-4.38944 -2.264833,-10.85056 0,-15.47283 z m -15.300853,8.82121 c 3.759729,0 9.620249,3.175 12.422187,6.4135 a 8.7312499,8.7312499 0 0 1 0.997479,1.37848 c -4.402667,0 -11.27125,-4.04548 -13.49375,-7.79198 0.03175,-0.0106 0.07673,-0.005 0.07408,-0.0106 z m 32.511999,1.16681 c 2.19075,4.49792 2.193396,10.71034 0,15.40669 -2.233083,-4.57729 -2.235729,-10.91671 0,-15.41727 z"></path>
            <path d="m 38.529753,131.0235 a 14.313958,14.313958 0 0 1 1.989667,-0.52917 l 1.666875,-2.88925 a 3.4925,3.4925 0 0 0 0.759354,0.26458 v 2.36009 c 0.288396,0 0.563562,-0.0423 0.859896,-0.0423 0.206375,0 0.396875,0.0238 0.600604,0.0291 v -2.29394 a 3.6009791,3.6009791 0 0 0 1.021292,-0.30956 l 1.666875,2.88925 a 14.512396,14.512396 0 0 1 1.989666,0.52916 l -2.479146,-4.27831 a 3.8602708,3.8602708 0 1 0 -5.617104,0 z"></path>
            <path d="m 64.456274,160.19381 3.511021,6.08541 c -0.127,0.10584 -0.264584,0.20638 -0.373063,0.3228 l -4.418542,-2.93423 c -0.22225,0.43656 -0.460375,0.85989 -0.719666,1.27264 l 4.339166,2.88396 a 4.0348958,4.0348958 0 0 0 -0.216958,0.7329 h -7.392458 a 13.644562,13.644562 0 0 1 -2.413,1.4605 h 9.808104 a 3.8602708,3.8602708 0 1 0 3.786187,-4.59846 3.7041666,3.7041666 0 0 0 -1.103312,0.18256 l -4.423833,-7.67292 a 17.478375,17.478375 0 0 1 -0.383646,2.26484 z"></path>
            <path d="m 17.574752,173.15045 a 3.8602708,3.8602708 0 0 0 3.78619,-3.12473 h 9.675811 a 13.443479,13.443479 0 0 1 -2.407708,-1.4605 h -7.268103 a 3.5348333,3.5348333 0 0 0 -0.24077,-0.79375 l 4.23333,-2.81516 c -0.26458,-0.4154 -0.50006,-0.83873 -0.72231,-1.27794 l -4.33652,2.88396 a 4.2836041,4.2836041 0 0 0 -0.41275,-0.34925 l 3.47133,-6.01133 a 17.409583,17.409583 0 0 1 -0.38894,-2.25161 l -4.40531,7.62529 a 3.7517916,3.7517916 0 0 0 -0.99483,-0.14816 3.8629166,3.8629166 0 1 0 0,7.72318 z"></path>
          </g>
        </svg>
      </div>
      <div className="flex flex-row w-full rounded-md p-1 text-sm items-center bg-[#1d1e3a]">
        <button
          className={`flex grow justify-center px-3 py-1.5 rounded-sm ${
            page === "bounties" ? "bg-[#5046e5] text-white" : "text-gray-400"
          }`}
          onClick={() => setPage("bounties")}
        >
          Bounties
        </button>
        <button
          className={`flex grow justify-center px-3 py-1.5 rounded-sm ${
            page === "awards" ? "bg-[#5046e5] text-white" : "text-gray-400"
          }`}
          onClick={awardsPage}
        >
          Awards
        </button>
      </div>
      {page === "bounties" ? (
        <ul className="flex w-full flex-col gap-3 p-4 text-xs">
          {bounties._tag === "success" &&
            bounties.data.map((bounty) => (
              <li key={bounty.id}>
                <BountyCard bounty={bounty} />
              </li>
            ))}
          {bounties._tag === "loading" && (
            <div className="text-white">loading...</div>
          )}
        </ul>
      ) : (
        <ul className="flex w-full flex-col gap-3 p-4 text-xs">
          {awards._tag === "success" &&
            awards.data.map((award) => (
              <li key={award.id}>
                <AwardCard award={award} />
              </li>
            ))}
          {awards._tag === "loading" && (
            <div className="text-white">loading...</div>
          )}
        </ul>
      )}
    </main>
  );
}

function BountyCard(props: { bounty: Bounty }) {
  const url = props.bounty.org.avatar_url;
  let avatar;
  if (url && url.startsWith("https://")) {
    avatar = url;
  } else if (url) {
    avatar = `https://console.algora.io/${url}`;
  }
  return (
    <Link href={props.bounty.task.url} target="_blank" rel="noopener">
      <div className="flex items-center gap-4 group">
        <div className="flex shrink-0 rounded-xl h-12 w-12 overflow-hidden">
          <img
            src={avatar}
            alt={props.bounty.org.name ?? props.bounty.org.handle}
          />
        </div>
        <div className="flex gap-2">
          <span className="font-emoji text-sm">💎</span>
          <div className="space-y-0.5">
            <p className="text-gray-200 group-hover:text-white">
              <span className="font-bold">{props.bounty.org.name}</span> shared
              a{" "}
              <span className="font-bold">{props.bounty.reward_formatted}</span>{" "}
              bounty
            </p>
            <div className="whitespace-nowrap text-gray-500">
              {dayjs(props.bounty.created_at).fromNow()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function AwardCard(props: { award: Bounty }) {
  const url = props.award.org.avatar_url;
  let avatar;
  if (url && url.startsWith("https://")) {
    avatar = url;
  } else if (url) {
    avatar = `https://console.algora.io/${url}`;
  }
  const succ = props.award.claims
    .filter((s) => s.status === "payment_succeeded")
    .pop();
  const name = succ?.solver.login;
  return (
    <Link href={props.award.task.url} target="_blank" rel="noopener">
      <div className="flex items-center gap-4 group">
        <div className="flex shrink-0 rounded-xl h-12 w-12 overflow-hidden">
          <img
            src={avatar}
            alt={props.award.org.name ?? props.award.org.handle}
          />
        </div>
        <div className="flex gap-2">
          <span className="font-emoji text-sm">{props.award.type === "tip" ? "💸" : "💰"}</span>
          <div className="space-y-0.5">
            <p className="text-gray-200 group-hover:text-white">
              <span className="font-bold">{name}</span> has been{" "}
              {props.award.type === "tip" ? "tipped" : "awarded"}{" "}
              <span className="font-bold">{props.award.reward_formatted}</span>
            </p>
            <div className="whitespace-nowrap text-gray-500">
              {dayjs(props.award.created_at).fromNow()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
