import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';

import {
    signMessageOnEthereum,
    signMessageOnSolana,
} from '../utils';

import { PhantomInjectedProvider, SupportedEVMChainIds, TLog, Props } from './types';

import { connect, silentlyConnect } from '../utils/connect';
import { setupEvents } from '../utils/setupEvents';
import { ensureEthereumChain } from '../utils/ensureEthereumChain';
import { useEthereumSelectedAddress } from '../utils/getEthereumSelectedAddress';

// =============================================================================
// Constants
// =============================================================================

const message = 'c5c1edfc94623bd5b2a7c5b8acb15599d3908f95ab3f8bf00ee40e786831781d';

// =============================================================================
// Typedefs
// =============================================================================

export type ConnectedAccounts = {
    solana: PublicKey | null;
    ethereum: string | null;
};

export type ConnectedMethods =
    | {
    chain: string;
    name: string;
    onClick: (props?: any) => Promise<string>;
}
    | {
    chain: string;
    name: string;
    onClick: (chainId?: any) => Promise<void | boolean>;
};

// =============================================================================
// Hooks
// =============================================================================
/**
 * @DEVELOPERS
 * The fun stuff!
 */
export const useProps = (provider: PhantomInjectedProvider | null): Props => {
    /** Logs to display in the Sandbox console */
    const [logs, setLogs] = useState<TLog[]>([]);

    const createLog = useCallback(
        (log: TLog) => {
            return setLogs((logs) => [...logs, log]);
        },
        [setLogs]
    );

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, [setLogs]);

    const [ethereumSelectedAddress, setEthereumSelectedAddress] = useEthereumSelectedAddress(provider?.ethereum);

    /** Side effects to run once providers are detected */
    useEffect(() => {
        if (!provider) return;
        const { solana, ethereum } = provider;

        // attempt to eagerly connect on initial startup
        silentlyConnect({ solana, ethereum });
        setupEvents({ solana, ethereum }, createLog, setEthereumSelectedAddress);

        return () => {
            solana.disconnect();
        };
    }, [provider, createLog, setEthereumSelectedAddress]);

    /** Connect to both Solana and Ethereum Providers */
    const handleConnect = useCallback(async () => {
        if (!provider) return;
        const { solana, ethereum } = provider;

        await connect({ solana, ethereum });

        // Immediately switch to Ethereum Goerli for Sandbox purposes
        await ensureEthereumChain(ethereum, SupportedEVMChainIds.EthereumGoerli);
    }, [provider]);

    /**
     * Switch Ethereum Chains
     * When a user connects to a dApp, Phantom considers them connected on all chains
     * When the Ethereum provider's chainId is changed, Phantom will not prompt the user for approval
     * */
    const isEthereumChainIdReady = useCallback(
        async (chainId: SupportedEVMChainIds) => {
            if (!provider) return false;
            const { ethereum } = provider;
            return await ensureEthereumChain(ethereum, chainId);
        },
        [provider]
    );

    const handleSignMessageOnSolana = useCallback(async () => {
        if (!provider) return;
        const { solana } = provider;
        try {
            const signedMessage = await signMessageOnSolana(solana, message);
            console.log("Signed on solana " + JSON.stringify(signedMessage));
            return signedMessage;
        } catch (error) {
            console.log("Error on solana " + error.message);
        }
    }, [provider]);

    const handleSignMessageOnEthereum = useCallback(
        async (chainId) => {
            // set ethereum provider to the correct chainId
            const ready = await isEthereumChainIdReady(chainId);
            if (!ready) return;
            const { ethereum } = provider;
            try {
                const signedMessage = await signMessageOnEthereum(ethereum, message);
                console.log("Signed on Ethereum " + JSON.stringify(signedMessage));
                return signedMessage;
            } catch (error) {
                console.log("Error on Ethereum " + error.message);
            }
        },
        [provider, isEthereumChainIdReady]
    );

    /**
     * Disconnect from Solana
     * At this time, there is no way to programmatically disconnect from Ethereum
     * MULTI-CHAIN PROVIDER TIP: You can only disconnect on the solana provider. But after when disconnecting your should use the
     * multi-chain connect method to reconnect.
     */
    const handleDisconnect = useCallback(async () => {
        if (!provider) return;
        const { solana } = provider;
        try {
            await solana.disconnect();
        } catch (error) {
            console.log("Error during Solana disconnection " + error.message);
        }
    }, [provider]);

    const connectedMethods = useMemo(() => {
        return [
            {
                chain: 'solana',
                name: 'Sign Message',
                onClick: handleSignMessageOnSolana,
            },
            {
                chain: 'ethereum',
                name: 'Sign Message',
                onClick: handleSignMessageOnEthereum,
            },
            {
                chain: 'solana',
                name: 'Disconnect',
                onClick: handleDisconnect,
            },
        ];
    }, [
        handleSignMessageOnSolana,
        handleSignMessageOnEthereum,
        handleDisconnect,
    ]);

    return {
        connectedAccounts: {
            solana: provider?.solana?.publicKey,
            ethereum: ethereumSelectedAddress,
        },
        connectedMethods,
        handleConnect,
        logs,
        clearLogs,
    };
};
