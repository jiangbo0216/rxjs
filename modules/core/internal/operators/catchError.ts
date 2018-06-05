import { ObservableInput, Operation, FOType, Sink, SinkArg, Source } from "../types";
import { Observable, sourceAsObservable } from "../Observable";
import { Subscription } from "../Subscription";
import { fromSource } from "../create/from";

export function catchError<T, R>(handler: (err: any) => ObservableInput<R>): Operation<T, T|R> {
  return (source: Observable<T>) =>
    sourceAsObservable((type: FOType.SUBSCRIBE, dest: Sink<T|R>, downstreamSubs: Subscription) => {
      if (type === FOType.SUBSCRIBE) {
        const upstreamSubs = new Subscription();
        downstreamSubs.add(upstreamSubs);
        source(type, (t: FOType, v: SinkArg<T>, upstreamSubs: Subscription) => {
          if (t === FOType.ERROR) {
            upstreamSubs.unsubscribe();
            let result: Source<T>;
            try {
              result = fromSource(handler(v));
            } catch (err) {
              dest(FOType.ERROR, err, downstreamSubs);
              return;
            }
            result(FOType.SUBSCRIBE, dest, downstreamSubs);
          } else {
            dest(t, v, downstreamSubs);
          }
        }, upstreamSubs);
      }
    });
}