import { Editors } from './editors'

export default function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <h1 className="text-lg font-semibold">Notra Editor in the App Router</h1>
      <Editors />
    </main>
  )
}
