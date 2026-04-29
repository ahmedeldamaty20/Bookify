'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignInButton, SignUpButton, UserButton, Show, useUser } from "@clerk/nextjs";
import { navItems } from '@/lib/constants';

export default function Navbar() {

	const pathName = usePathname();
	const { user } = useUser();

  return (
    <header className="w-full fixed z-50 bg-primary backdrop-blur-md border-b border-black/10">
      <div className="wrapper navbar-height py-4 flex justify-between items-center">
				<Link href="/" className="flex gap-0.5 items-center">
					<Image src="/assets/logo.png" alt="Bookify" width={42} height={26} />
					<span className="logo-text">Bookify</span>
				</Link>
				<nav className="w-fit flex gap-7 items-center">
					{
						navItems.map(({ label, href }) => {
							const isActive = pathName === href || (href !== "/" && pathName.startsWith(href));
							
							return (
								<Link key={href} href={href} className={`nav-link-base ${isActive ? 'nav-link-active' : 'text-black hover:opacity-70'}`}>
									{label}
								</Link>
							);	
						})
					}
					<div className="flex gap-7.5 items-center">
						<Show when="signed-out">
							<SignInButton>
								<button className="nav-link-base text-black hover:opacity-70">
									Sign In
								</button>
							</SignInButton>
							<SignUpButton> 
								<button className="nav-link-base text-black hover:opacity-70">
									Sign Up
								</button>
							</SignUpButton>
						</Show>
						<Show when="signed-in">
							<div className="nav-user-link">
              	<UserButton />
              	{ user?.firstName && <Link href="/subscriptions" className="nav-user-name">{user.firstName}</Link> }
            	</div>
						</Show>
					</div>
				</nav>
			</div>
    </header>
  )
}
